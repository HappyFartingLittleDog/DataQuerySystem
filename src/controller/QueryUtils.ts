import {InsightError} from "./IInsightFacade";
import Decimal from "decimal.js";

export function findFilter(content: unknown): string {
	if (Object.keys(content as object).length > 1){
		throw new InsightError("Filter has multiple keys");
	}
	if (Object.prototype.hasOwnProperty.call(content, "GT")) {
		return "GT";
	} else if (Object.prototype.hasOwnProperty.call(content, "LT")) {
		return "LT";
	} else if (Object.prototype.hasOwnProperty.call(content, "EQ")) {
		return "EQ";
	} else if (Object.prototype.hasOwnProperty.call(content, "AND")) {
		return "AND";
	} else if (Object.prototype.hasOwnProperty.call(content, "OR")) {
		return "OR";
	} else if (Object.prototype.hasOwnProperty.call(content, "IS")) {
		return "IS";
	} else if (Object.prototype.hasOwnProperty.call(content, "NOT")) {
		return "NOT";
	} else {
		throw new InsightError("No FILTER found");
	}
}

export function compareKeys(keys1: string[], keys2: string[]): void {
	for (const key of keys1) {
		if (!keys2.includes(key)) {
			throw new InsightError("COLUMNS keys must be in GROUP or be an APPLY key.");
		}
	}
}

export function findMax(objArr: any[], key: string): number {
	let max: number = objArr[0][key];
	for (let i: number = 1; i < objArr.length; i++) {
		if (objArr[i][key] > max) {
			max = objArr[i][key];
		}
	}
	return max;
}

export function findMin(objArr: any[], key: string): number {
	let min: number = objArr[0][key];
	for (let i: number = 1; i < objArr.length; i++) {
		if (objArr[i][key] < min) {
			min = objArr[i][key];
		}
	}
	return min;
}

export function findAvg(objArr: any[], key: string): number {
	let sum: Decimal = new Decimal(0);
	for (const obj of objArr) {
		sum = sum.add(new Decimal(obj[key]));
	}
	let avg = sum.toNumber() / objArr.length;
	return Number(avg.toFixed(2));
}

export function findSum(objArr: any[], key: string): number {
	let sum: number = 0;
	for (const obj of objArr) {
		sum += obj[key];
	}
	return Number(sum.toFixed(2));
}

export function findCount(objArr: any[], key: string): number {
	let collector: any[] = [];
	for (const obj of objArr) {
		if (!collector.includes(obj[key])) {
			collector.push(obj[key]);
		}
	}
	return collector.length;
}
