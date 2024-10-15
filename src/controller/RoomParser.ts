import * as http from "http";
import {InsightError} from "./IInsightFacade";

/*
export function find(file: any,node: string): any {
	for (let child of file.childNodes) {
		if (child.nodeName === node) {
			return child;
		}
		if (child.childNodes) {
			let result = find(child, node);
			if(result != null){
				return result;
			}
		}
	}
	return null;
}*/

export function find(file: any,node: string): any[] {
	let nodeList: any[] = [];
	if(file.childNodes) {
		for (let child of file.childNodes) {
			if (child.nodeName === node) {
				nodeList.push(child);
			} else {
				let result = find(child, node);
				if(result.length !== 0) {
					nodeList = nodeList.concat(result);
				}
			}
		}
	}
	return nodeList;
}


function handleAText(ele: any) {
	for (let toResult of ele.childNodes) {
		if (toResult.nodeName === "a") {
			for (let result of toResult.childNodes) {
				if(result.nodeName === "#text"){
					return result.value;
				}
			}
		}
	}
	return "";
}
function handleAHref(ele: any) {
	for (let toResult of ele.childNodes) {
		if (toResult.nodeName === "a") {
			for (let result of toResult.attrs) {
				if(result.name === "href") {
					return result.value;
				}
			}
		}
	}
	return "";
}

function handleText(ele: any) {
	for (let result of ele.childNodes) {
		if (result.nodeName === "#text") {
			return result.value.replaceAll("\n", "").trim();
		}
	}
	return "";
}
function checkTdClass(td: any,tdClass: string){
	for(let attr of td.attrs){
		if(attr.name === "class" && attr.value === tdClass){
			return true;
		}
	}
	return false;
}

export function extractBuildings(nodes: any): Map<string, string[]>{
	let buildingList = new Map<string, string[]>();
	let buildingShortName: string = "";
	let buildingtName: string = "";
	let buildingAddress: string = "";
	let buildingPath: string = "";
	for(let node of nodes) {
		let trList = find(node, "tr");
		for (let tr of trList){
			let tdList = find(tr,"td");
			let hasFoundcode = false;
			let hasFoundaddress = false;
			let hasFoundtitle = false;
			let hasFoundNothing = false;
			for(let td of tdList){
				if (checkTdClass(td, "views-field views-field-field-building-code")) {
					buildingShortName = handleText(td);
					hasFoundcode = true;
				} else if (checkTdClass(td, "views-field views-field-field-building-address")) {
					buildingAddress = handleText(td);
					hasFoundaddress = true;
				} else if (checkTdClass(td, "views-field views-field-title")) {
					buildingtName = handleAText(td);
					hasFoundtitle = true;
				}else if (checkTdClass(td, "views-field views-field-nothing")) {
					buildingPath = handleAHref(td);
					hasFoundNothing = true;
				}
			}
			if (hasFoundcode && hasFoundaddress && hasFoundtitle) {
				let infoList: string[] = [];
				infoList.push(buildingShortName);
				infoList.push(buildingtName);
				infoList.push(buildingAddress);
				infoList.push(buildingPath);
				buildingList.set(buildingShortName, infoList);
			}
		}
	}
	return buildingList;
}


export function extractRooms(nodes: any): string[][]{
	let roomNumber: string = "";
	let capacity: string = "";
	let furniture: string = "";
	let roomType: string = "";
	let additionalInfo: string = "";
	let roomList: string[][] = [];
	for(let node of nodes) {
		let trList = find(node, "tr");
		for (let tr of trList){
			let tdList = find(tr,"td");
			let hasFoundNumber = false;
			let hasFoundCapacity = false;
			let hasFoundFurniture = false;
			let hasFoundType = false;
			let hasFoundNothing = false;
			for(let td of tdList) {
				if (checkTdClass(td, "views-field views-field-field-room-number")) {
					roomNumber = handleAText(td);
					hasFoundNumber = true;
				} else if (checkTdClass(td, "views-field views-field-field-room-capacity")) {
					capacity = handleText(td);
					hasFoundCapacity = true;
				} else if (checkTdClass(td, "views-field views-field-field-room-furniture")) {
					furniture = handleText(td);
					hasFoundFurniture = true;
				} else if (checkTdClass(td, "views-field views-field-field-room-type")) {
					roomType = handleText(td);
					hasFoundType = true;
				} else if (checkTdClass(td, "views-field views-field-nothing")) {
					additionalInfo = handleAHref(td);
					hasFoundNothing = true;
				}
			}
			if (hasFoundNumber && hasFoundCapacity && hasFoundFurniture && hasFoundType && hasFoundNothing) {
				roomList.push([roomNumber,capacity,furniture,roomType,additionalInfo]);
			}
		}
	}
/*	for (let info of node.childNodes) {
		if(info.nodeName === "tr") {
			for (let ele of info.childNodes) {
				if (ele.nodeName === "td") {
					if (checkTdClass(ele,"views-field views-field-field-room-number")) {
						roomNumber = handleAText(ele);
					} else if (checkTdClass(ele, "views-field views-field-field-room-capacity")) {
						capacity = handleText(ele);
					} else if (checkTdClass(ele, "views-field views-field-field-room-furniture")) {
						furniture = handleText(ele);
					} else if (checkTdClass(ele, "views-field views-field-field-room-type")) {
						roomType = handleText(ele);
					} else if (checkTdClass(ele, "views-field views-field-nothing")) {
						additionalInfo = handleAHref(ele);
					}
				}
			}
			roomList.push([roomNumber,capacity,furniture,roomType,additionalInfo]);
		}
	}*/
	return roomList;
}

export function getLocation(address: string): Promise<any>{
	let request = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team129/" + encodeURI(address);
	return new Promise<string>(((resolve, reject) => {
		http.get(request, (response: any) => {
			let data = "";
			response.on("data", (chunk: any) => {
		            data += chunk;
			});
			response.on("end", (chunk: any) => {
				try {
					let location = JSON.parse(data);
					resolve(location);
				} catch(e) {
					resolve("error");
				}
			});
		}).on("error", (e) => {
			resolve("error");
		});
	}));

}
