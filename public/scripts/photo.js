const titleElement = document.getElementById('title');
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const buttonContainerElement = document.getElementById('button-container');
const photoButtonElement = document.getElementById('photo-button');
let capturing = false;
let imageCapture;

const height = 480;
const width = 640;

const checkAvailability = () => {
  if ('mediaDevices' in navigator) {
    return true;
  } else {
    return false;
  }
};

const activatePhotoUpload = () => {
  photoButtonElement.innerText = 'Upload your image';
  titleElement.innerText = 'You can upload an image and view it here';

  const inputFileElement = document.createElement('input');

  inputFileElement.type = 'file';
  inputFileElement.id = 'photo-input';
  inputFileElement.name = 'photo';
  inputFileElement.accept = 'image/*';
  inputFileElement.classList.add('photo-input', 'hidden');

  buttonContainerElement.insertBefore(inputFileElement, photoButtonElement);
  photoButtonElement.onclick = uploadImage;
  inputFileElement.oninput = async (event) => {
    try {
      const imageBitmap = await createImageBitmap(event.currentTarget.files[0]);
      drawCanvas(imageBitmap);
      canvasElement.classList.remove('hidden');
    } catch {
      console.log('Image is corrupted');
    }
  };
};

const uploadImage = () => {
  document.getElementById('photo-input').click();
};

const activateCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    if ('srcObject' in video) {
      videoElement.srcObject = stream;
    } else {
      videoElement.src = URL.createObjectURL(stream);
    }
    imageCapture = new ImageCapture(stream.getVideoTracks()[0]);

    videoElement.classList.remove('hidden');
    canvasElement.classList.add('hidden');
    photoButtonElement.onclick = captureImage;
    photoButtonElement.innerText = 'Take a photo';
  } catch {
    videoElement.classList.add('hidden');

    console.log('Camera could not start.');
    console.log('Activate photo upload button.');
    activatePhotoUpload();
  }
};

const captureImage = async () => {
  if (!capturing) {
    capturing = true;
  } else {
    return;
  }

  const track = videoElement.srcObject.getTracks()[0];
  const blob = await imageCapture.takePhoto();
  const imageBitmap = await createImageBitmap(blob);
  drawCanvas(imageBitmap);
  track.stop();
  cleanupAfterPhoto();
};

const drawCanvas = (imageBitmap) => {
  canvasElement.width = width;
  canvasElement.height = height;

  canvasElement.getContext('2d').drawImage(imageBitmap, 0, 0, width, height);
};

const cleanupAfterPhoto = () => {
  canvasElement.classList.remove('hidden');
  videoElement.classList.add('hidden');
  photoButtonElement.innerText = 'Try again';
  photoButtonElement.onclick = activateCamera;
  capturing = false;
};

const available = checkAvailability();
if (available) {
  activateCamera();
} else {
  activatePhotoUpload();
}
