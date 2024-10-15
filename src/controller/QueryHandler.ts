import {InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import * as typeGuards from "./TypeGuards";
import * as utils from "./QueryUtils";
import QueryChecker from "./QueryChecker";

export default class QueryHandler {
	private currDataset: any[];
	private currDatasetKind: string;
	private currResults: any[];
	private hasTrans: boolean;
	private columnKeys: string[];
	private groupKeys: string[];
	private applyKeys: Map<string, [string, string]>;
	private sortKeys: string[];
	private sortDir: string;

	constructor(checker: QueryChecker) {
		this.currDataset =  checker.getCurrDataset();
		this.currDatasetKind = checker.getCurrDatasetKind();
		this.currResults = this.currDataset;
		this.hasTrans = checker.getHasTrans();
		this.columnKeys = checker.getColumnKeys();
		this.groupKeys = checker.getGroupKeys();
		this.applyKeys = checker.getApplyKeys();
		this.sortKeys = checker.getSortKeys();
		this.sortDir = checker.getSortDir();
	}

	public handleQuery(query: unknown): InsightResult[] {
		if (!typeGuards.isRecord(query)) {
			throw new InsightError();
		}

		this.currResults = this.handleWHERE(query["WHERE"]);

		if (this.hasTrans) {
			this.currResults = this.handleTRANSFORMATIONS();
		}

		if (this.currResults.length > 5000) {
			throw new ResultTooLargeError("Result too large");
		}

		return this.handleOPTIONS(query["OPTIONS"]);
	}

	private handleWHERE(where: unknown): any[] {
		if (!typeGuards.isRecord(where)) {
			throw new InsightError();
		}

		if (Object.keys(where).length === 0) {
			return this.currDataset;
		}

		let filter: string = utils.findFilter(where);
		return this.handleFILTER(filter, where[filter], this.currResults);
	}

	private handleTRANSFORMATIONS(): any[] {
		let groupedResults: any[] = this.groupBy(this.groupKeys);
		let newResults: InsightResult[] = [];
		for (const groupedResult of groupedResults) {
			let temp: InsightResult = {};
			for (const [applyKey, rules] of this.applyKeys.entries()) {
				let resultNum: number;
				let key: string = this.currDatasetKind + "_" + rules[1].split("_")[1];
				if (rules[0] === "MAX") {
					resultNum = utils.findMax(groupedResult, key);
				} else if (rules[0] === "MIN") {
					resultNum = utils.findMin(groupedResult, key);
				} else if (rules[0] === "AVG") {
					resultNum = utils.findAvg(groupedResult, key);
				} else if (rules[0] === "SUM") {
					resultNum = utils.findSum(groupedResult, key);
				} else {
					resultNum = utils.findCount(groupedResult, key);
				}
				temp[applyKey] = resultNum;
			}
			for (const groupKey of this.groupKeys) {
				const strArray = groupKey.split("_");
				temp[groupKey] = groupedResult[0][this.currDatasetKind + "_" + strArray[1]];
			}
			newResults.push(temp);
		}

		return newResults;
	}

	private handleOPTIONS(options: unknown): InsightResult[] {
		if(!typeGuards.isRecord(options) || !typeGuards.isStringArray(options["COLUMNS"])) {
			throw new InsightError();
		}

		let insightResults: InsightResult[] = [];
		for (const result of this.currResults) {
			let temp: InsightResult = {};
			for (const column of this.columnKeys) {
				let resultKey: string;
				if (!this.hasTrans) {
					const strArray = column.split("_");
					resultKey = this.currDatasetKind + "_" + strArray[1];
				} else {
					resultKey = column;
				}
				temp[column] = result[resultKey];
			}
			insightResults.push(temp);
		}

		if(Object.prototype.hasOwnProperty.call(options, "ORDER")) {
			if (typeGuards.isString(options["ORDER"])) {
				const order: string = options["ORDER"];
				insightResults.sort((a, b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
			} else {
				insightResults = this.mergeSort(insightResults);
			}
		}
		return insightResults;
	}

	private mergeSort(array: any[]): any[] {
		if (array.length < 2) {
			return array;
		}
		const left: any[] = array.splice(0, array.length / 2);
		return this.merge(this.mergeSort(left), this.mergeSort(array));
	}

	private merge(leftArr: any[], rightArr: any[]): any[] {
		let tempArr: any[] = [];
		while (leftArr.length && rightArr.length) {
			if (this.compareFn(leftArr[0], rightArr[0]) < 0) {
				tempArr.push(leftArr.shift());
			} else {
				tempArr.push(rightArr.shift());
			}
		}
		return [...tempArr, ...leftArr, ...rightArr];
	}

	private compareFn(a: InsightResult, b: InsightResult): number {
		for (const key of this.sortKeys) {
			if (a[key] < b[key]) {
				return this.sortDir === "UP" ? -1 : 1;
			} else if (a[key] > b[key]) {
				return this.sortDir === "UP" ? 1 : -1;
			}
		}
		return 0;
	}

	private handleFILTER(filter: string, content: unknown, currResults: any[]): any[] {
		if (filter === "GT" || filter === "LT" || filter === "EQ") {
			return this.handleGTLTEQ(filter, content, currResults);
		} else if (filter === "IS") {
			return this.handleIS(content, currResults);
		} else if (filter === "AND") {
			if (!Array.isArray(content)) {
				throw new InsightError();
			}
			for (let internal of content) {
				let nextFilter: string = utils.findFilter(internal);
				currResults = this.handleFILTER(nextFilter, internal[nextFilter], currResults);
			}
			return currResults;
		} else if (filter === "OR") {
			if (!Array.isArray(content)) {
				throw new InsightError();
			}
			let tempResult: any[]  = [];
			for (let internal of content) {
				let nextFilter: string = utils.findFilter(internal);
				let result = this.handleFILTER(nextFilter, internal[nextFilter], currResults);
				tempResult = tempResult.concat(result.filter((a) => {
					return !tempResult.includes(a);
				}));
			}
			return tempResult;
		} else if (filter === "NOT") {
			if (!typeGuards.isRecord(content)) {
				throw new InsightError();
			}
			let nextFilter: string = utils.findFilter(content);
			let nextResults: any[] = this.handleFILTER(nextFilter, content[nextFilter], currResults);

			currResults = currResults.filter((a) => {
				return !nextResults.includes(a);
			});
		}
		return currResults;
	}

	private handleGTLTEQ(filter: string, content: unknown, currResults: any[]): any[] {
		if (!typeGuards.isRecord(content)) {
			throw new InsightError();
		}

		let strArray: string[] = []; // strArray[0] represents dataset id, strArray[1] represents mField or sField
		for (const filterKey in content) {
			strArray = filterKey.split("_");
		}

		let newResults: any[] = [];
		for (const result of currResults) {
			let desiredNum: number = content[strArray[0] + "_" + strArray[1]] as number;
			if ((filter === "GT" && result[this.currDatasetKind + "_" + strArray[1]] > desiredNum) ||
				(filter === "LT" && result[this.currDatasetKind + "_" + strArray[1]] < desiredNum) ||
				(filter === "EQ" && result[this.currDatasetKind + "_" + strArray[1]] === desiredNum)) {
				newResults.push(result);
			}
		}

		return newResults;
	}

	private handleIS(content: unknown, currResults: any[]): any[] {
		if (!typeGuards.isRecord(content)) {
			throw new InsightError();
		}

		let strArray: string[] = []; // strArray[0] represents dataset id, strArray[1] represents mField or sField
		for (const filterKey in content) {
			strArray = filterKey.split("_");
		}

		let newResults: any[] = [];
		let wc: [number, string] = this.checkWildcards(content[strArray[0] + "_" + strArray[1]] as string);
		for (const result of currResults) {
			if ((wc[0] === 0 && result[this.currDatasetKind + "_" + strArray[1]] === wc[1]) ||
				(wc[0] === -1 && (result[this.currDatasetKind + "_" + strArray[1]]).startsWith(wc[1])) ||
				(wc[0] === 1 && (result[this.currDatasetKind + "_" + strArray[1]]).endsWith(wc[1])) ||
				(wc[0] === 2 && (result[this.currDatasetKind + "_" + strArray[1]]).includes(wc[1]))) {
				newResults.push(result);
			}
		}
		return newResults;
	}

	// -1 means starts with string; 0 means no wildcard; 1 means ends with string; 2 means contains string
	private checkWildcards(str: string): [number, string] {
		const strArr: string[] = str.split("*");
		if (strArr.length === 3 && strArr[0] === "" && strArr[2] === "") {
			return [2, strArr[1]];
		} else if (strArr.length === 2 && strArr[0] === "") {
			return [1, strArr[1]];
		} else if (strArr.length === 2 && strArr[1] === "") {
			return [-1, strArr[0]];
		} else if (strArr.length === 1) {
			return [0, strArr[0]];
		} else {
			throw new InsightError();
		}
	}

	private groupBy(groupKeys: string[]): any[] {
		return [...this.currResults.reduce((result, currObj) => {
			const currKey = groupKeys.map((groupKey) =>
				currObj[this.currDatasetKind + "_" + groupKey.split("_")[1]]).join("-");
			if (!result.has(currKey)) {
				result.set(currKey, []);
			}
			result.get(currKey).push(currObj);
			return result;
		}, new Map()).values()];
	}
}
