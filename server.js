import dotenv from 'dotenv';
import bodyparser from 'body-parser';
import path from 'path';
import express from 'express';
import {
  addPost,
  deleteSubscription,
  getPosts,
  getSubscriptions,
  subscribe,
} from './db/db.js';
import webpush from 'web-push';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { urlencoded } = bodyparser;
const { sendNotification, setVapidDetails } = webpush;

const app = express();

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const publicKey =
  'BAbkadQ-WFyRlFHlO-b6bhXdr83yiLvxKJtQUkQmOAtufTxNjc5hf-_suujmHXbi6GO8nD0FdNa4IBIOwtzQTVI';
const privateKey = 'KnSyaNhl0KkpJJa0VOt-KQIdhLAoPXda_7SK-OmzSVI';
setVapidDetails('mailto:dummy@dummy.com', publicKey, privateKey);

// home
app.get('/', (req, res) => {
  console.info('Received GET for homepage');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/', async (req, res) => {
  const reqData = req.body;
  if (
    reqData.username.length > 1 &&
    reqData.title.length > 1 &&
    reqData.text.length > 1
  ) {
    const post = {
      ...reqData,
      date: new Date(),
    };
    console.log('Added post:\n', post);
    await addPost(post);
    await sendNotifications(reqData.username, reqData.title);
  }
  res.redirect('/');
});

app.post('/subscribe', async (req, res) => {
  console.log('Subscriptio received');
  const subscription = req.body;
  await subscribe(subscription);
  res.json({
    success: true,
  });
});

app.get('/posts', async (req, res) => {
  //access firestore
  const posts = await getPosts();
  console.info('Retrieving posts:\n', posts);
  res.json(
    posts
      .sort((p1, p2) => p2.date - p1.date)
      .map((post) => ({
        username: post.username,
        text: post.text,
        title: post.title,
      }))
  );
});

// photo
app.get('/photo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'photo.html'));
});

const sendNotifications = async (username, title) => {
  const subscriptions = await getSubscriptions();

  for (const { id, ...subscription } of subscriptions) {
    try {
      await sendNotification(
        subscription,
        JSON.stringify({
          title: `${username} just posted something new`,
          body: title,
          redirectUrl: '/',
        })
      );
    } catch {
      console.info('Push failed. Deleting user from subscriptions');
      deleteSubscription(id);
    }
  }
};

app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}.`);
});
