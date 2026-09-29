import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { webhookRouter } from './webhook';
import { placesRouter } from './places/router';

const app = express();
app.use(express.json());

// Built webapp (webapp/dist) is copied to bot/public at Docker build time.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/webhook', webhookRouter);
app.use('/api', placesRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`bot listening on :${port}`);
});
