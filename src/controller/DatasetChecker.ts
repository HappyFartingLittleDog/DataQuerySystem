import {InsightDataset, InsightError, Section,Room} from "./IInsightFacade";
import * as fs from "fs-extra";


export function isJsonString(str: string): boolean {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

export function checkID(id: string): boolean {
	let exist: boolean = false;
	       if(fs.existsSync("./data/" + id + ".json")){
			   exist = true;
		   }
	return (id.includes("_") || !id.replace(/\s*/g,"").length || id === undefined || exist);
}

export function getIDs(): Promise<string[]> {
	return fs.readdir("./data/").then((datasets)=>{
		let id =  [];
		for(let dataset of datasets){
			dataset = dataset.substring(0,dataset.length - 5);
			id.push(dataset);

		}
		return Promise.resolve(id);
	});
}
export function sectionHasAllKeys(sec: any): boolean {
	return (Object.prototype.hasOwnProperty.call(sec, "Subject") &&
		Object.prototype.hasOwnProperty.call(sec, "Course") &&
		Object.prototype.hasOwnProperty.call(sec, "Avg") &&
		Object.prototype.hasOwnProperty.call(sec, "Professor") &&
		Object.prototype.hasOwnProperty.call(sec, "Title") &&
		Object.prototype.hasOwnProperty.call(sec, "Pass") &&
		Object.prototype.hasOwnProperty.call(sec, "Fail") &&
		Object.prototype.hasOwnProperty.call(sec, "Audit") &&
		Object.prototype.hasOwnProperty.call(sec, "id") &&
		Object.prototype.hasOwnProperty.call(sec, "Year"));
}

export function sectionHasAllKeysInDatabase(sec: any): boolean {
	return (Object.prototype.hasOwnProperty.call(sec, "sections_dept") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_id") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_avg") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_instructor") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_title") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_pass") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_fail") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_audit") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_uuid") &&
		Object.prototype.hasOwnProperty.call(sec, "sections_year"));
}


