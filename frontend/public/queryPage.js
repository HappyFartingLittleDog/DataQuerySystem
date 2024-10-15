document.getElementById("query").addEventListener("click", handleClickSubmit);
document.addEventListener("DOMContentLoaded", loadDatasets);

function loadDatasets() {
	const req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState === XMLHttpRequest.DONE) {
			if (req.status === 200) {
				let datasetSelect = document.getElementById("datasetID");
				let res = JSON.parse(req.responseText);
				let datasets = res["result"];
				for (const dataset of datasets) {
					if (dataset["kind"] === "sections") {
						datasetSelect.add(new Option(dataset["id"], dataset["id"]));
					}
				}
			} else {
				alert("Fail to load datasets");
			}
		}
	};
	req.open("GET", "http://localhost:4321/datasets");
	req.send();
}

function handleClickSubmit() {
	let datasetID = document.getElementById("datasetID").value;
	let year = document.getElementById("year").value;
	let subject = document.getElementById("subject").value;
	let courseNum = document.getElementById("courseNum").value;
	let query = {
		"WHERE": {
			"AND": [
				{
					"AND": [
						{
							"IS": {
								[`${datasetID}_dept`]: subject
							}
						},
						{
							"IS": {
								[`${datasetID}_id`]: courseNum
							}
						}
					]
				},
				{
					"EQ": {
						[`${datasetID}_year`]: +year
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				`${datasetID}_dept`,
				`${datasetID}_id`,
				`${datasetID}_year`,
				"courseAvg"
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [
				`${datasetID}_dept`,
				`${datasetID}_id`,
				`${datasetID}_year`
			],
			"APPLY": [
				{
					"courseAvg": {
						"AVG": `${datasetID}_avg`
					}
				}
			]
		}
	};

	const req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState === XMLHttpRequest.DONE) {
			if (req.status === 200) {
				let res = JSON.parse(req.responseText);
				let result = res["result"][0];
				document.getElementById("response").innerHTML = "<div>Average score is: </div>" + result["courseAvg"];
			} else {
				alert(JSON.stringify(query));
				document.getElementById("response").innerHTML = "<div>Invalid Subject, Course # or Year</div>";
			}
		} else {
			document.getElementById("response").innerHTML = "<div>Querying...</div>";
		}
	};
	req.open("POST", "http://localhost:4321/query");
	req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	req.send(JSON.stringify(query));
}
