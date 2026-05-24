import { httpRouter } from 'convex/server';
import { auth } from './auth';

const http = httpRouter();

// Convex Auth's HTTP routes live at /.auth/* — sign-in, sign-up, callbacks.
auth.addHttpRoutes(http);

export default http;
