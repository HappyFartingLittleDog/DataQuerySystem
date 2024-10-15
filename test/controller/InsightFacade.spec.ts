import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError,
	InsightDataset
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";
import * as typeGuards from "../../src/controller/TypeGuards";

describe("InsightFacade", function () {
	this.timeout(10000);
	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/courses.zip",
		rooms: "./test/resources/archives/rooms.zip",
		rooms2:"./test/resources/archives/rooms2.zip"
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run of the test suite
		fs.emptydir(persistDirectory);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.emptydirSync(persistDirectory);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Sections)
				.then((result: string[]) => expect(result).to.deep.equal(expected));
		});

		it("Should add a valid room dataset", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms)
				.then((result: string[]) =>{
					expect(result).to.deep.equal(expected);
				});
		});
		it("remove room dataset ",function(){
			let response: any;
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("rooms",content,InsightDatasetKind.Rooms)
				.then(()=>{
					return insightFacade.removeDataset("rooms");
				})
				.then((removedId)=>{
					response = removedId;
				})
				.catch((err)=>{
					response = err;
				})
				.finally(()=>{
					console.log(response);
					expect(response).to.deep.equal(id);
				});
		});

		it("remove the same dataset twice",function(){
			let response: any;
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("rooms",content,InsightDatasetKind.Rooms)
				.then(()=>{
					return insightFacade.removeDataset("rooms");
				})
				.then((removedId)=>{
					response = removedId;
				})
				.then(()=>{
					return insightFacade.removeDataset("rooms");
				})
				.then((removedId)=>{
					response = removedId;
				})
				.catch((err)=>{
					response = err;
				})
				.finally(()=>{
					console.log(response);
					expect(response).to.be.instanceOf(NotFoundError);
				});
		});

		it("Should add multiple valid datasets with different content",function(){
			let response: any;
			const id: string = "rooms";
			const contentOne: string = datasetContents.get("rooms") ?? "";
			const contentTwo: string = datasetContents.get("rooms2") ?? "";
			return insightFacade.addDataset("rooms1",contentOne,InsightDatasetKind.Rooms)
				.then((addedIds)=>{
					return insightFacade.addDataset("rooms2",contentTwo,InsightDatasetKind.Rooms);
				})
				.then((addedIds)=>{
					expect(addedIds).to.deep.equal(["rooms1", "rooms2"]);
				});
		});

		it("Should list datasets with different content",function(){
			const contentOne: string = datasetContents.get("rooms") ?? "";
			const contentTwo: string = datasetContents.get("rooms2") ?? "";
			return insightFacade.addDataset("rooms1",contentOne,InsightDatasetKind.Rooms)
				.then((addedIds)=>{
					return insightFacade.addDataset("rooms2",contentTwo,InsightDatasetKind.Rooms);
				})
				.then((addedIds)=>{
					return insightFacade.listDatasets();
				}).then((response)=>{
					expect(response).to.be.an.instanceof(Array);
					expect(response).to.have.length(2);
					const insightDatasetsRoomsOne = response.find((dataset: InsightDataset)=>dataset.id === "rooms1");
					expect(insightDatasetsRoomsOne ).to.exist;
					expect(insightDatasetsRoomsOne ).to.deep.equal({
						id:"rooms1",
						kind:InsightDatasetKind.Rooms,
						numRows:364,
					});
					const insightDatasetsRoomsTwo = response.find((dataset: InsightDataset)=>dataset.id === "rooms2");
					expect(insightDatasetsRoomsTwo).to.exist;
					expect(insightDatasetsRoomsTwo).to.deep.equal({
						id:"rooms2",
						kind:InsightDatasetKind.Rooms,
						numRows:342,
					});
				});
		});

/*		it("Should add section and room datasets",function(){
			let response: any;
			const id: string = "rooms";
			const contentRoom: string = datasetContents.get("rooms") ?? "";
			const contentSection: string = datasetContents.get("sections") ?? "";
			return insightFacade.addDataset("rooms",contentRoom,InsightDatasetKind.Rooms)
				.then((addedIds)=>{
					return insightFacade.addDataset("sections",contentSection,InsightDatasetKind.Sections);
				})
				.then((addedIds)=>{
					expect(addedIds).to.deep.equal(["rooms", "sections"]);
				});
		});*/


	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset(
					"rooms",
					datasetContents.get("rooms") ?? "",
					InsightDatasetKind.Rooms
				),
				insightFacade.addDataset(
					"sections",
					datasetContents.get("sections") ?? "",
					InsightDatasetKind.Sections
				)
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.emptydirSync(persistDirectory);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries/c2",
			{
				assertOnResult: (actual, expected, input) => {
					expect(actual).to.deep.members(expected);
					if (expected.length > 1) {
						if (typeGuards.isRecord(input) && typeGuards.isRecord(input["OPTIONS"])) {
							if (typeGuards.isString(input["OPTIONS"]["ORDER"])) {
								let s: string = input["OPTIONS"]["ORDER"];
								for (let i = 0; i < actual.length - 1; i++) {
									expect(actual[i][s] < actual[i + 1][s] || actual[i][s] === actual[i + 1][s]);
								}
							} else if (typeGuards.isRecord(input["OPTIONS"]["ORDER"])) {
								if (typeGuards.isStringArray(input["OPTIONS"]["ORDER"]["keys"])) {
									for (let i = 0; i < actual.length - 1; i++) {
										for (const key of input["OPTIONS"]["ORDER"]["keys"]) {
											if (input["OPTIONS"]["ORDER"]["dir"] === "UP") {
												expect(actual[i][key] < actual[i + 1][key] ||
													actual[i][key] === actual[i + 1][key]);
												if (actual[i][key] < actual[i + 1][key]) {
													break;
												}
											} else {
												expect(actual[i][key] > actual[i + 1][key] ||
													actual[i][key] === actual[i + 1][key]);
												if (actual[i][key] > actual[i + 1][key]) {
													break;
												}
											}
										}
									}
								}
							}
						}
					}
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});
