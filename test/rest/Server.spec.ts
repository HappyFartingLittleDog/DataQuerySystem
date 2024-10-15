import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";
import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";
import * as typeGuards from "../../src/controller/TypeGuards";


describe("Server", function () {
	const persistDirectory = "./data";
	let facade: InsightFacade;
	let server: Server;
	this.timeout(10000);
	use(chaiHttp);
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
		rooms: "./test/resources/archives/rooms.zip",
		rooms2:"./test/resources/archives/rooms2.zip"
	};
	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start();


	});

	after(function () {
		// TODO: stop server here once!
		server.stop();
	});

	beforeEach(function () {
		fs.emptydirSync(persistDirectory);
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(function () {
		fs.emptydirSync(persistDirectory);
		// might want to add some process logging here to keep track of what"s going on
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset", function () {
		try {
			return chai.request("http://localhost:4321")
				.put("/dataset/sections/sections")
				.send(fs.readFileSync("./test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("delete test for courses dataset", function () {
		return chai.request("http://localhost:4321")
			.put("/dataset/sections/sections")
			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res1: ChaiHttp.Response) {
				try {
					return chai.request("http://localhost:4321")
						.delete("/dataset/sections")
						.send(fs.readFileSync("./test/resources/archives/pair.zip"))
						.set("Content-Type", "application/x-zip-compressed")
						.then(function (res2: ChaiHttp.Response) {
							// some logging here please!
							expect(res2.status).to.be.equal(200);
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					console.log(err);
				}
			})
			.catch(function (err) {
				// some logging here please!
				console.log(err);
				expect.fail();
			});
	});

	it("delete test for courses dataset", function () {
		return chai.request("http://localhost:4321")
			.put("/dataset/sections/sections")
			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res1: ChaiHttp.Response) {
				try {
					return chai.request("http://localhost:4321")
						.delete("/dataset/sections")
						.send(fs.readFileSync("./test/resources/archives/pair.zip"))
						.set("Content-Type", "application/x-zip-compressed")
						.then(function (res2: ChaiHttp.Response) {
							// some logging here please!
							expect(res2.body["result"]).to.be.equal("sections");
							expect(res2.status).to.be.equal(200);
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					console.log(err);
				}
			})
			.catch(function (err) {
				// some logging here please!
				console.log(err);
				expect.fail();
			});
	});

	it("post test for courses dataset", function () {
		let query = {
			WHERE: {
				GT: {
					sections_avg: 99
				}
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_avg"
				],
				ORDER: "sections_avg"
			}
		};
		let expected = [
			{sections_dept: "cnps", sections_avg: 99.19},
			{sections_dept: "math", sections_avg: 99.78},
			{sections_dept: "math", sections_avg: 99.78}
		];
		return chai.request("http://localhost:4321")
			.put("/dataset/sections/sections")
			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res1: ChaiHttp.Response) {
				try {
					return chai.request("http://localhost:4321")
						.post("/query")
						.send(query)
						.then(function (res2: ChaiHttp.Response) {
							// some logging here please!
							expect(res2.status).to.be.equal(200);
							expect(res2.body["result"]).to.be.deep.equal(expected);
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					console.log(err);
				}
			})
			.catch(function (err) {
				// some logging here please!
				console.log(err);
				expect.fail();
			});
	});

	it("get test ", function () {

		return chai.request("http://localhost:4321")
			.put("/dataset/sections/sections")
			.send(fs.readFileSync("./test/resources/archives/pair.zip"))
			.set("Content-Type", "application/x-zip-compressed")
			.then(function (res1: ChaiHttp.Response) {
				try {
					return chai.request("http://localhost:4321")
						.put("/dataset/rooms/rooms")
						.send(fs.readFileSync("./test/resources/archives/rooms.zip"))
						.set("Content-Type", "application/x-zip-compressed")
						.then(function (res2: ChaiHttp.Response) {
							try {
								return chai.request("http://localhost:4321")
									.get("/datasets")
									.then(function (res3: ChaiHttp.Response) {
										expect(res3.status).to.be.equal(200);
									})
									.catch(function (err) {
										// some logging here please!
										console.log(err);
										expect.fail();
									});
							} catch (err) {
								console.log(err);
							}
						})
						.catch(function (err) {
							// some logging here please!
							console.log(err);
							expect.fail();
						});
				} catch (err) {
					console.log(err);
				}
			})
			.catch(function (err) {
				// some logging here please!
				console.log(err);
				expect.fail();
			});
	});


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
