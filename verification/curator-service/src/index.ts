import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import validateEnv from './util/validate-env';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as sourcesController from './controllers/sources';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);

// Configure frontend app routes.
app.get('/', homeController.index);

// Configure API app routes.
const apiRouter = express.Router();
apiRouter.get('/sources/', sourcesController.list);
apiRouter.get('/sources/:id([a-z0-9]{24})', sourcesController.get);
apiRouter.post('/sources/', sourcesController.create);
apiRouter.put('/sources/:id([a-z0-9]{24})', sourcesController.update);
apiRouter.delete('/sources/:id([a-z0-9]{24})', sourcesController.del);
app.use('/api', apiRouter);

// Configure dependencies.
axios.defaults.baseURL = env.DATASERVER_API_URL;
(async (): Promise<void> => {
    try {
        console.log('Connecting to instance', env.DB_CONNECTION_STRING);

        await mongoose.connect(env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        console.log('Connected to the database');
    } catch (e) {
        console.error('Failed to connect to DB', e);
    }
})();
export default app;
