import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import {InsightDatasetKind, NotFoundError} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";


export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.addDataset);
		this.express.delete("/dataset/:id", Server.removeDataset);
		this.express.post("/query", Server.performQuery);
		this.express.get("/datasets", Server.listDatasets);

	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static addDataset(req: Request, res: Response) {
		try {
			let datasetKind: any;
			let insightFacade = new InsightFacade();
			let buffer = req.body;
			if (req.params.kind === "sections") {
				datasetKind = InsightDatasetKind.Sections;
			} else if (req.params.kind === "rooms") {
				datasetKind = InsightDatasetKind.Rooms;
			} else {
				datasetKind = null;
			}
		   insightFacade.addDataset(req.params.id, Buffer.from(buffer).toString("base64"), datasetKind).then((arr) => {
			   res.status(200).json({result: arr});

		   }).catch((err) => {
				console.log(err);
			   res.status(400).json({error: err.message});
			   console.log(err.message);
		   });
	   } catch (err) {
			console.log(err);
		   res.status(400).json({error: "unexpected error"});
	   }
	}

	private static removeDataset(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();
			insightFacade.removeDataset(req.params.id).then((str) => {
				res.status(200).json({result: str});
			}).catch((err) => {
				if(err instanceof NotFoundError) {
					res.status(404).json({error: err.message});
				}else{
					res.status(400).json({error: err.message});
				}
			});
		} catch (err) {
			res.status(400).json({error: "unexpected error"});
		}
	}

	private static performQuery(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();

			insightFacade.performQuery(req.body).then((str) => {
				res.status(200).json({result: str});
			}).catch((err) => {
				console.log(err);
				res.status(400).json({error: err.message});
			});
		} catch (err) {
			res.status(400).json({error: "unexpected error"});
		}
	}

	private static listDatasets(req: Request, res: Response) {
		try {
			console.log("list");
			let insightFacade = new InsightFacade();

			insightFacade.listDatasets().then((arr) => {
				res.status(200).json({result: arr});
			}).catch((err) => {
				console.log(err);
				res.status(400).json({error: err.message});
			});
		} catch (err) {
			console.log(err);
			res.status(400).json({error: "unexpected error"});
		}
	}

	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
