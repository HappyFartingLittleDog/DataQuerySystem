import {InsightDataset, InsightDatasetKind, Section, Room,InsightError} from "./IInsightFacade";
import {sectionHasAllKeys} from "./DatasetChecker";
import * as parser from "./RoomParser";
import {extractRooms, getLocation} from "./RoomParser";

export function addSectionIfHasAllKeys(sec: any,secArray: Section[]): void {
	if (sectionHasAllKeys(sec)) {
		let section: Section = {
			sections_dept: sec["Subject"],
			sections_id: sec["Course"],
			sections_avg: sec["Avg"],
			sections_instructor: sec["Professor"],
			sections_title: sec["Title"],
			sections_pass: sec["Pass"],
			sections_fail: sec["Fail"],
			sections_audit: sec["Audit"],
			sections_uuid: sec["id"].toString(),
			sections_year: (sec["Section"] === "overall" ? 1900 : parseInt(sec["Year"],10)),
		};
		secArray.push(section);
	}
}

export function getSectionFileContent(id: string,array: Section[]){
	let insightDataset: InsightDataset = {
		id: id,
		kind: InsightDatasetKind.Sections,
		numRows: array.length,
	};
	return [array,insightDataset];
}
export function setSectionDatasetMap(id: string,array: Section[],dMap: Map<string, [Section[]|Room[],InsightDataset]>){
	let insightDataset: InsightDataset = {
		id: id,
		kind: InsightDatasetKind.Sections,
		numRows: array.length,
	};
	dMap.set(id, [array,insightDataset]);
}


export function setRoomDatasetMap(id: string,array: Room[],dMap: Map<string, [Section[]|Room[],InsightDataset]>){
	let insightDataset: InsightDataset = {
		id: id,
		kind: InsightDatasetKind.Rooms,
		numRows: array.length,
	};
	dMap.set(id, [array,insightDataset]);
}

export function getRoomFileContent(id: string,array: Room[]){
	let insightDataset: InsightDataset = {
		id: id,
		kind: InsightDatasetKind.Rooms,
		numRows: array.length,
	};
	return[array,insightDataset];
}

export function addRoomIfHasAllKeys(roomHtml: any,roomArray: Room[],list: string[]): Promise<any> {
	let tbodies = parser.find(roomHtml,"tbody");
	if( tbodies === null) {
		return Promise.resolve();
	}
	let rooms = extractRooms(tbodies);
	return getLocation(list[2]).then((value)=>{
		if(value !== "error" && value["lat"] && value["lon"]) {
			for (let r of rooms) {
				let room: Room = {
					rooms_fullname: list[1],
					rooms_shortname: list[0],
					rooms_number: r[0],
					rooms_name: list[0] + "_" + r[0],
					rooms_address: list[2],
					rooms_lat: value["lat"],
					rooms_lon: value["lon"],
					rooms_seats: Number(r[1]),
					rooms_type: r[3],
					rooms_furniture: r[2],
					rooms_href: r[4],
				};
				roomArray.push(room);
			}
		}
	 return Promise.resolve();
	}).catch((e)=>{
		return Promise.reject(new InsightError());
	});
}
