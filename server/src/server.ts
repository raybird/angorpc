import express from 'express';
import cors from 'cors';
import { createFetchHandler } from '@orpc/server/fetch';
import { appRouter } from './router.js';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors({
  origin: '*',
}));
app.use(express.json());

const fetchHandler = createFetchHandler({ router: appRouter });

app.all('/api/rpc/*', async (req, res) => {
  const protocol = req.secure ? 'https' : 'http';
  const url = `${protocol}://${req.get('host')}${req.originalUrl}`;
  
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.append(key, value);
      }
    }
  });

  const requestInit: RequestInit = {
    method: req.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    requestInit.body = JSON.stringify(req.body);
  }

  const webReq = new Request(url, requestInit);

  try {
    const webRes = await fetchHandler({ request: webReq, context: {} });
    
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const bodyText = await webRes.text();
    res.send(bodyText);
  } catch (err) {
    console.error('oRPC Adapter Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`[oRPC Server] running on http://localhost:${port}`);
});
