let file = null;
document.getElementById("addDataset").addEventListener('change', handleAddDataset)
document.getElementById("removeDataset").addEventListener('click', handleRemoveDataset)
document.getElementById("submitAddDataset").addEventListener('click', handleSubmitAdd)
document.getElementById("cancelAddDataset").addEventListener('click', handleCancelAdd)
document.getElementById("submitRemoveDataset").addEventListener('click', handleSubmitRemove)
document.getElementById("cancelRemoveDataset").addEventListener('click', handleCancelRemove)
document.addEventListener("DOMContentLoaded", updateList);

function handleCancelRemove(){
	document.getElementById("form_2").className="form"
	document.getElementsByName("dataset_id_remove")[0].value = null;
}
function handleSubmitRemove(){
	let datasetID = document.getElementsByName("dataset_id_remove")[0].value;

	const req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState === XMLHttpRequest.DONE) {
			if (req.status === 200) {
				updateList()
				document.getElementById("loading_1").className="loading_1";
			} else {
				document.getElementById("loading_1").className="loading_1";
				alert("error in removing dataset");
			}
		}
	};
	let uri = "http://localhost:4321/dataset/" + datasetID;
	req.open("DELETE", uri, true);
	handleCancelRemove()
	document.getElementById("loading_1").className="loading_1 open";
	req.send();

}

function handleRemoveDataset(){
	document.getElementById("form_2").className="form open"
}
function handleCancelAdd(){
	document.getElementById("form_1").className="form";
	let kindList = document.getElementsByName("kind");
	document.getElementById("addDataset").value = null;
	document.getElementsByName("dataset_id_add")[0].value = null;
	kindList[0].checked = false;
	kindList[1].checked = false;

}
function handleAddDataset(event) {
	  document.getElementById("form_1").className ="form open";
	  file = document.getElementById("addDataset").files[0];
}

function updateList(){
	const req = new XMLHttpRequest();
	req.open("GET", "http://localhost:4321/datasets", true);
	req.onreadystatechange = function() {
		if (req.readyState === XMLHttpRequest.DONE) {
			if (req.status === 200) {
				console.log("change");
				let datasets = JSON.parse(req.responseText)
				document.getElementById("tbody").innerHTML = "";
				for (let dataset of datasets.result){
					let table = document.getElementById("tbody");
					let newRow = table.insertRow();
					let newCellID = newRow.insertCell();
					let newCellNumRows = newRow.insertCell();
					let newCellKind = newRow.insertCell();
					newCellID.innerHTML = dataset.id;
					newCellNumRows.innerHTML = dataset.numRows;
					newCellKind.innerHTML = dataset.kind;
				}
			} else {
				alert("error in retrieving datasets");
			}
		}
	};
	req.send();
}

function handleSubmitAdd(event){
	let kindList = document.getElementsByName("kind");
	let datasetID = document.getElementsByName("dataset_id_add")[0].value;
	let kind = null;
	if (kindList[0].checked){
		kind = kindList[0].value
	}else if(kindList[1].checked){
		kind = kindList[1].value
	}
	let uri = "http://localhost:4321/dataset/" + datasetID + "/" + kind;
	const req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState === XMLHttpRequest.DONE) {
			if (req.status === 200) {
				updateList()
				document.getElementById("loading_1").className="loading_1";
			} else {
				document.getElementById("loading_1").className="loading_1";
				alert(req.responseText);
			}
		}
	};
	req.open("PUT", uri, true);
	req.setRequestHeader("Content-Type", "application/x-zip-compressed");
	handleCancelAdd()
	document.getElementById("loading_1").className="loading_1 open";
	req.send(file);
}


