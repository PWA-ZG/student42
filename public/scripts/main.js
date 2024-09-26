import { set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

const SYNC_ID = 'sync-post';
const notificationButtonElement = document.getElementById(
  'notification-button'
);

const checkSW = async () => {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('sw.js', {
      type: 'module',
    });
  }
};

const getPosts = async () => {
  const postsContainer = document.getElementById('posts');
  postsContainer.replaceChildren();

  try {
    const res = await fetch('/posts');
    const posts = await res.json();
    if (!posts || posts.length < 1) {
      throw new Error();
    }

    for (const post of posts) {
      postsContainer.appendChild(createPostArticle(post));
    }
  } catch {
    console.log('Cannot fetch posts.');
    const cannotFetchElement = document.createElement('h3');
    cannotFetchElement.innerText =
      'We are currently unable to fetch all posts.';
    postsContainer.appendChild(cannotFetchElement);
  }
};

const createPostArticle = (post) => {
  const postArticleElement = document.createElement('article');
  const postHeaderElement = document.createElement('div');
  const usernameElement = document.createElement('h3');
  const titleElement = document.createElement('p');
  const textElement = document.createElement('p');

  usernameElement.innerText = post.username;
  titleElement.innerText = post.title;
  textElement.innerText = post.text;

  postHeaderElement.classList.add('post-header');
  postArticleElement.classList.add('post');
  usernameElement.classList.add('post-username');
  titleElement.classList.add('post-title');
  textElement.classList.add('post-text');

  postHeaderElement.appendChild(usernameElement);
  postHeaderElement.appendChild(titleElement);
  postArticleElement.appendChild(postHeaderElement);
  postArticleElement.appendChild(textElement);

  return postArticleElement;
};

document.getElementById('form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const username = formData.get('username');
  const title = formData.get('title');
  const text = formData.get('text');

  const id = new Date().toISOString();
  const post = {
    username,
    title,
    text,
  };
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    set(id, post);
    const swRegistration = await navigator.serviceWorker.ready;
    await swRegistration.sync.register(SYNC_ID);
    console.log('Post queued.');
  } else {
    const request = new Request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });
    await fetch(request);
  }
  await getPosts();
  event.target.reset();
});

notificationButtonElement.addEventListener('click', async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const swReg = await navigator.serviceWorker.ready;
      let sub = await swReg.pushManager.getSubscription();
      if (sub === null) {
        try {
          const publicKey =
            'BAbkadQ-WFyRlFHlO-b6bhXdr83yiLvxKJtQUkQmOAtufTxNjc5hf-_suujmHXbi6GO8nD0FdNa4IBIOwtzQTVI';
          sub = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });

          const res = await fetch('/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sub),
          });
          if (res.ok) {
            alert('You are successfully subscribed to push notifications');
          }
        } catch {
          await sub.unsubscribe();
          console.log('Cannot subscribe.');
          alert('Something went wrong. Please try to subscribe again.');
        }
      } else {
        console.log('User already subscribed.');
      }
    } else {
      console.log('User declined notifications.');
    }
  } else {
    notificationButtonElement.classList.remove('notification-button');
    notificationButtonElement.classList.add('notification-button-disabled');
    notificationButtonElement.setAttribute('disabled', '');
  }
});

checkSW();
getPosts();
