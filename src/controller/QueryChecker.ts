import * as typeGuards from "./TypeGuards";
import * as utils from "./QueryUtils";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";

const mFieldSection = ["avg", "pass", "fail", "audit", "year"];
const sFieldSection = ["dept", "id", "instructor", "title", "uuid"];
const mFieldRoom = ["lat", "lon", "seats"];
const sFieldRoom = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const tokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
const mTokens = ["MAX", "MIN", "AVG", "SUM"];

export default class QueryChecker {
	private currDataset: string;
	private datasetMap: Map<string, [any[], InsightDataset]>;
	private hasTrans: boolean;
	private columnKeys: string[];
	private groupKeys: string[];
	private applyKeys: Map<string, [string, string]>;
	private sortKeys: string[];
	private sortDir: string;

	constructor(datasetMap: Map<string, [any[], InsightDataset]>) {
		this.currDataset = "";
		this.datasetMap = datasetMap;
		this.columnKeys = [];
		this.hasTrans = false;
		this.groupKeys = [];
		this.applyKeys = new Map();
		this.sortKeys = [];
		this.sortDir = "";
	}

	public checkQuery(query: unknown): void {
		if (!typeGuards.isRecord(query)) {
			throw new InsightError("Invalid query");
		}

		if (!Object.prototype.hasOwnProperty.call(query, "WHERE")) {
			throw new InsightError("Missing WHERE");
		}

		if (!Object.prototype.hasOwnProperty.call(query, "OPTIONS")) {
			throw new InsightError("Missing OPTIONS");
		}

		if (Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")) {
			this.hasTrans = true;
		}

		this.checkWHERE(query["WHERE"]);
		this.checkOPTIONS(query["OPTIONS"]);

		if (this.hasTrans) {
			this.checkTRANSFORMATIONS(query["TRANSFORMATIONS"]);
		} else {
			if (Object.keys(query).length > 2) {
				throw new InsightError("Excess keys in query");
			}
		}

		if (this.currDataset === "") {
			throw new InsightError("Dataset name cannot be empty string");
		}
	}

	private checkWHERE(where: unknown): void {
		if (!typeGuards.isRecord(where)) {
			throw new InsightError();
		}

		if (Object.keys(where).length === 0) {
			return;
		}

		let filter: string = utils.findFilter(where);
		this.checkFILTERs(filter, where[filter]);
	}

	private checkFILTERs(filter: string, content: unknown): void {
		if (filter === "GT" || filter === "LT" || filter === "EQ" || filter === "IS") {
			if (!typeGuards.isRecord(content)) {
				throw new InsightError();
			}

			let count: number = 1;
			let strArray: string[] = [];
			for (const filterKey in content) {
				// content contains more than 1 property
				if (count > 1) {
					throw new InsightError("More than one property in " + filter);
				}

				strArray = filterKey.split("_");
				if (filter === "IS") {
					if (strArray.length !== 2 || typeof content[filterKey] !== "string") {
						throw new InsightError();
					}
				} else {
					if (strArray.length !== 2 || typeof content[filterKey] !== "number") {
						throw new InsightError();
					}
				}
				this.validateKey(filterKey);

				count++;
			}
		} else if (filter === "AND" || filter === "OR") {
			if (!Array.isArray(content) || content.length === 0) {
				throw new InsightError("Invalid " + filter + " clause");
			}

			for (let internal of content) {
				let nextFilter: string = utils.findFilter(internal);
				this.checkFILTERs(nextFilter, internal[nextFilter]);
			}
		} else {
			if (!typeGuards.isRecord(content)) {
				throw new InsightError("Invalid NOT clause");
			}

			let nextFilter: string = utils.findFilter(content);
			this.checkFILTERs(nextFilter, content[nextFilter]);
		}
	}

	private checkOPTIONS(options: unknown): void {
		if (!typeGuards.isRecord(options) || !(Object.prototype.hasOwnProperty.call(options, "COLUMNS"))
			|| !typeGuards.isStringArray(options["COLUMNS"])){
			throw new InsightError("Invalid OPTIONS clause");
		} else {
			if (Object.keys(options).length !== 1) {
				if (!(Object.keys(options).length === 2 && Object.prototype.hasOwnProperty.call(options, "COLUMNS") &&
					Object.prototype.hasOwnProperty.call(options, "ORDER"))) {
					throw new InsightError("Excess keys in OPTIONS");
				}
			}
		}

		for (const column of options["COLUMNS"]) {
			if (!this.hasTrans) {
				this.validateKey(column);
			}
			this.columnKeys.push(column);
		}

		if (Object.prototype.hasOwnProperty.call(options, "ORDER")) {
			this.checkORDER(options["ORDER"]);
		}
	}

	private checkORDER(order: unknown): void {
		if (typeGuards.isString(order) && !this.columnKeys.includes(order)) {
			throw new InsightError("ORDER must be in COLUMNS");
		} else if (typeGuards.isRecord(order)) {
			if (!Object.prototype.hasOwnProperty.call(order, "dir")) {
				throw new InsightError("Missing dir in ORDER");
			} else {
				if (!(order["dir"] === "UP" || order["dir"] === "DOWN")) {
					throw new InsightError("dir must be UP or DOWN");
				}
				this.sortDir = order["dir"];
			}
			if (!Object.prototype.hasOwnProperty.call(order, "keys")) {
				throw new InsightError(("Missing keys in ORDER"));
			} else {
				if (!typeGuards.isStringArray(order["keys"])) {
					throw new InsightError("Invalid keys in ORDER");
				}
				for (const key of order["keys"]) {
					if (!this.columnKeys.includes(key)) {
						throw new InsightError("keys in ORDER must be in COLUMNS");
					}
					this.sortKeys.push(key);
				}
			}
		}
	}

	private checkTRANSFORMATIONS(transformations: unknown): void {
		if (!typeGuards.isRecord(transformations)) {
			throw new InsightError("Invalid TRANSFORMATION clause");
		}

		if (!Object.prototype.hasOwnProperty.call(transformations, "GROUP") ||
			!typeGuards.isStringArray(transformations["GROUP"])) {
			throw new InsightError("Missing GROUP in TRANSFORMATIONS or Invalid GROUP clause");
		}

		if (!Object.prototype.hasOwnProperty.call(transformations, "APPLY") ||
			!Array.isArray(transformations["APPLY"])) {
			throw new InsightError("Missing APPLY in TRANSFORMATIONS or Invalid APPLY clause");
		}

		let transKeys: string[] = [];
		for (const groupKey of transformations["GROUP"]) {
			this.validateKey(groupKey);
			if (!transKeys.includes(groupKey)) {
				transKeys.push(groupKey);
			}
			this.groupKeys.push(groupKey);
		}

		if (this.groupKeys.length === 0) {
			throw new InsightError("GROUP cannot be empty");
		}
		this.handleAPPLY(transformations["APPLY"], transKeys);
	}

	private handleAPPLY(apply: any[], transKeys: string[]) {
		for (const applyRules of apply) {
			let count: number = 0;
			for (const [applyKey, rules] of Object.entries(applyRules)) {
				if (!typeGuards.isString(applyKey) || applyKey.length === 0 || applyKey.includes("_") ||
					!typeGuards.isRecord(rules)) {
					throw new InsightError("Invalid apply keys in APPLY");
				}

				for (const [applyToken, key] of Object.entries(rules)) {
					if (!typeGuards.isString(applyToken) || !typeGuards.isString(key) || !tokens.includes(applyToken) ||
						(mTokens.includes(applyToken) && !(mFieldSection.includes(key.split("_")[1]) ||
							mFieldRoom.includes(key.split("_")[1])))) {
						throw new InsightError("Invalid apply token or Invalid keys");
					}
					this.validateKey(key);
					this.applyKeys.set(applyKey, [applyToken, key]);
					count++;
				}

				if (!transKeys.includes(applyKey)) {
					transKeys.push(applyKey);
				} else {
					throw new InsightError("Duplicate APPLY keys");
				}
				count++;
			}

			if (count !== 2) {
				throw new InsightError("Invalid APPLY clauses");
			}
		}
		utils.compareKeys(this.columnKeys, transKeys);
	}

	private validateKey(key: string): void {
		const strArray: string[] = key.split("_");
		this.checkCurrentDataset(strArray[0]);
		let datasetKind: InsightDatasetKind = this.datasetMap.get(this.currDataset)![1].kind;
		if (strArray.length !== 2 ||
			(datasetKind === "sections" &&
				!(sFieldSection.includes(strArray[1]) || mFieldSection.includes(strArray[1]))) ||
			(datasetKind === "rooms" &&
				!(sFieldRoom.includes(strArray[1]) || mFieldRoom.includes(strArray[1])))) {
			throw new InsightError("Invalid keys");
		}
	}

	private checkCurrentDataset(newDataset: string): void {
		if (this.currDataset === "") {
			if (!this.datasetMap.has(newDataset)) {
				throw new InsightError("Dataset id does not exist");
			}
			this.currDataset = newDataset;
		} else if (this.currDataset !== "" && newDataset !== "" && newDataset !== this.currDataset) {
			throw new InsightError("Query cannot access more than 1 dataset");
		}
	}

	public getCurrDataset(): any[] {
		return this.datasetMap.get(this.currDataset)![0];
	}

	public getHasTrans(): boolean {
		return this.hasTrans;
	}

	public getColumnKeys(): string[] {
		return this.columnKeys;
	}

	public getGroupKeys(): string[] {
		return this.groupKeys;
	}

	public getApplyKeys(): Map<string, [string, string]> {
		return this.applyKeys;
	}

	public getCurrDatasetKind(): string {
		return this.datasetMap.get(this.currDataset)![1]["kind"];
	}

	public getSortKeys(): string[] {
		return this.sortKeys;
	}

	public getSortDir(): string {
		return this.sortDir;
	}
}
