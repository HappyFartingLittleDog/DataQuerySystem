import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	Section,
	Room
} from "./IInsightFacade";

import * as fs from "fs-extra";
import QueryChecker from "./QueryChecker";
import QueryHandler from "./QueryHandler";
import * as datasetChecker from "./DatasetChecker";
import * as datasetAdder from "./DatasetAdder";
import * as parse5 from "parse5";
import * as parser from "./RoomParser";
import JSZip from "jszip";
import {getRoomFileContent, getSectionFileContent} from "./DatasetAdder";
import {sectionHasAllKeysInDatabase} from "./DatasetChecker";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
const persisDir = "./data";

export default class InsightFacade implements IInsightFacade {
	public datasetMap: Map<string, [any[],InsightDataset]> = new Map();


	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]>{
		if(!fs.existsSync("./data/")){
			fs.mkdir("./data");
		}
		/** if is an invalid id  or already contains this id**/
		if(datasetChecker.checkID(id)){
			return Promise.reject(new InsightError("Failed to add this dataset. Invalid dataset id"));
		}
		let promises: Array<Promise<any>> = [];
		if (InsightDatasetKind.Sections === kind) {
			return this.addSection(content, promises, id);
		} else if (InsightDatasetKind.Rooms === kind){
			return this.addRoom(content, promises, id);
		} else{
			return Promise.reject(new InsightError("Failed to add this dataset. Invalid dataset kind"));
		}
	}


	private addRoom(content: string, promises: Array<Promise<any>>, id: string) {
		let zip = new JSZip();
		let fileToLoad: JSZip;
		let infoList: string[][] = [];
		let roomArray: Room[] = [];
		let infoIndex: number = 0;
		return zip.loadAsync(content, {base64: true})
			.then((deserializedZip) => {
				fileToLoad = deserializedZip;
				return  fileToLoad.file("index.htm")?.async("string");
			}).then((html) => {
				try{
					let document: any = parse5.parse(html!);
					let tbodies = parser.find(document, "tbody");
					let buildingInfoMAP = parser.extractBuildings(tbodies);
					buildingInfoMAP.forEach((value: string[], key: string) => {
						let path = value[3].substring(2);
						let bFile = fileToLoad.file(path);
						if (bFile != null && buildingInfoMAP.get(key) !== undefined) {
							let test = buildingInfoMAP.get(key);
							infoList.push(test!);
							promises.push(bFile.async("string"));
						}
					});
					return Promise.all(promises);
				}catch (err){
					return Promise.reject(new InsightError("Failed to add this dataset. Invalid zip. file"));
				}
			}).then((values) => {
				let promisesOnAdd: Array<Promise<any>> = [];
				for (let item of values) {
					let document: any = parse5.parse(item);
					promisesOnAdd.push(datasetAdder.addRoomIfHasAllKeys(document, roomArray, infoList[infoIndex++]));
				}
				return Promise.all(promisesOnAdd);
			}).then(()=>{
				if (roomArray.length === 0) {
					return Promise.reject(new InsightError("Failed to add this dataset. Invalid zip. file"));
				}
				let fileContent = getRoomFileContent(id, roomArray);
				return fs.writeFile(persisDir + "/" + id + ".json", JSON.stringify(fileContent));
			}).then(() => {
				return datasetChecker.getIDs();
			}).then((idArray) => {
				return Promise.resolve(idArray);
			}).catch((err) => {
				console.log(err);
				return Promise.reject(new InsightError(err.message));
			});
	}

	private addSection(content: string, promises: Array<Promise<any>>, id: string) {
		let zip = new JSZip();
		return zip.loadAsync(content, {base64: true})
			.then((deserializedZip) => {
				let isInvalid = false;
				deserializedZip.forEach((relativePath, file) => {
					/** if there is folder in courses ->not a valid file**/
					/** if dir is not courses ->not a valid file**/
					let checkName = file.name.split("/")[0] !== "courses";
					if ( checkName || ( file.dir && checkName)) {
						isInvalid = true;
					}
					promises.push(file.async("string"));
				});
				if(isInvalid){
					return Promise.reject(new InsightError("Failed to add this dataset. Invalid zip. file"));
				}else{
					return Promise.all(promises);
				}
			}).then((values) => {
				let secArray: Section[] = [];
				for (let item of values) {
					if (datasetChecker.isJsonString(item)) {
						let jsonObj = JSON.parse(item);
						/** check if each section contains all query keys**/
						for (let sec of jsonObj["result"]) {
							datasetAdder.addSectionIfHasAllKeys(sec, secArray);
						}
					}
				}
				/** check if it's not a valid dataset(no valid sections)**/
				if (secArray.length === 0) {
					return Promise.reject(new InsightError("Failed to add this dataset. Invalid zip. file"));
				}
				let fileContent = getSectionFileContent(id, secArray);
				return fs.writeFile(persisDir + "/" + id + ".json", JSON.stringify(fileContent));
			}).then(() => {
				return datasetChecker.getIDs();
			}).then((idArray) => {
				return Promise.resolve(idArray);
			}).catch((err) => {
				return Promise.reject(new InsightError(err.message));
			});
	}

	public removeDataset(id: string): Promise<string> {
		/** if invalid key **/
		if(id.includes("_") || !id.replace(/\s*/g,"").length || id === undefined){
			return Promise.reject(new InsightError("Failed to remove this dataset. Invalid dataset ID"));
		}
		/** if don't have this dataset **/
		let exist: boolean = false;

		if(fs.existsSync("./data/" + id + ".json")){
			exist = true;
		}
		if(exist === false){
			return Promise.reject(new NotFoundError("Failed to remove this dataset. Don't have this dataset"));
		}

		/** remove from dataset **/

		return fs.readdir("./data/").then((datasets)=>{
			for(let dataset of datasets){
				/** remove section  **/
				if(dataset ===  id + ".json"){
					fs.unlinkSync(persisDir + "/" + id + ".json");
				}
			}
			return Promise.resolve(id);
		});

	}

	private loadDatasets(){
		let datasetsLists = [];
		let datasets = fs.readdirSync("./data/");
		datasets = datasets.filter((item) => !(/(^|\/)\.[^/.]/g).test(item));
		for(let dataset of datasets) {
			if(fs.existsSync("./data/" + dataset)) {
				datasetsLists.push(fs.readFileSync("./data/" + dataset));
			}
		}
		for(let item of datasetsLists){
			let objArray: any[] = [];
			let  jsonObj = JSON.parse(item.toString());
			if(datasetChecker.sectionHasAllKeysInDatabase(jsonObj[0][0])){
				for (let sec of jsonObj[0]) {
					let section = this.sectionLoad(sec);
					objArray.push(section);
				}
			}else{
				for (let rm of jsonObj[0]) {
					let room = this.roomLoad(rm);
					objArray.push(room);
				}
			}
			this.datasetMap.set(jsonObj[1]["id"], [objArray, jsonObj[1]]);
		}
	}


	private roomLoad(rm: any) {
		let room: Room = {
			rooms_fullname: rm["rooms_fullname"],
			rooms_shortname: rm["rooms_shortname"],
			rooms_number: rm["rooms_number"],
			rooms_name: rm["rooms_name"],
			rooms_address: rm["rooms_address"],
			rooms_lat: rm["rooms_lat"],
			rooms_lon: rm["rooms_lon"],
			rooms_seats: rm["rooms_seats"],
			rooms_type: rm["rooms_type"],
			rooms_furniture: rm["rooms_furniture"],
			rooms_href: rm["rooms_href"],
		};
		return room;
	}

	private sectionLoad(sec: any) {
		let section: Section = {
			sections_dept: sec["sections_dept"],
			sections_id: sec["sections_id"],
			sections_avg: sec["sections_avg"],
			sections_instructor: sec["sections_instructor"],
			sections_title: sec["sections_title"],
			sections_pass: sec["sections_pass"],
			sections_fail: sec["sections_fail"],
			sections_audit: sec["sections_audit"],
			sections_uuid: sec["sections_uuid"],
			sections_year: sec["sections_year"],
		};
		return section;
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		this.loadDatasets();
		let checker: QueryChecker;
		try {
			checker = new QueryChecker(this.datasetMap);
			checker.checkQuery(query);
		} catch (e) {
			return Promise.reject(e);
		}

		let insightResults: InsightResult[] = [];
		try {
			let handler: QueryHandler = new QueryHandler(checker);
			insightResults = handler.handleQuery(query);
		} catch (e) {
			return Promise.reject(e);
		}
		this.datasetMap.clear();

		return Promise.resolve(insightResults);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		this.loadDatasets();
		let insightDatasetArray: InsightDataset[] = [];
		this.datasetMap.forEach((map)=>{
			insightDatasetArray.push(map[1]);
		});
		this.datasetMap.clear();
		return Promise.resolve(insightDatasetArray);
	}
}

