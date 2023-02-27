import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './router';

const app = express();
app.use(express.json());
app.use(cors([]));

app.use(router);

app.listen(process.env.PORT || 3003, () => {
   try {
      console.log('Initializing database module...');

      console.log(`Task server running on ${process.env.PORT} over SSL [OK]`)

  } catch (err) {
      console.error(err);
  
      process.exit(1);
  }
});