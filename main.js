const fileDom = document.getElementById('file-uploader');
const outputDom = document.getElementById('outputFileBlock');
const startButtonDom = document.getElementById('startButton');
const fileNamenDom = document.getElementById('inputFileName');
const fileReader = new FileReader();
let uploadFile = null;

fileDom.addEventListener('change', (e) => {

	if (e.target && e.target.files) {
		// get file object
		uploadFile = e.target.files[0];

		// check is csv file
		const fileNameArrary = uploadFile.name ? uploadFile.name.split('.') : null;

		if (!fileNameArrary) {
			return;
		}

		if (fileNameArrary[fileNameArrary.length - 1] != 'xlsx') {
			alert("檔案格式錯誤!!");
			return;
		}

		// show file name
		fileNamenDom.textContent = uploadFile.name;
		// show start button
		startButtonDom.id = "enableStartButton";
	}
});

/**
 * start button on click event
 */
function startClick() {

	if (uploadFile) {
		// use file reader read file as text
		fileReader.readAsBinaryString(uploadFile);
	} else {
		alert("請先上傳檔案");
	}
}

/**
 * file reader read file
 */
fileReader.onload = function () {
	const data = fileReader.result;
	let workbook = null;

	try {
		workbook = XLSX.read(data, { type: 'binary' });
	} catch (e) {
		alert('file error');
		console.warn(e);
		return;
	}

	console.log("___workbook:", workbook);
	// format file to objecg
	const formatOutputObject = formatWorkbookToObject(workbook);
	createOutputDownloadLink(formatOutputObject);
}

/**
 * set first variable as variable name
 * @return Object
 * @example 
 * en:{
 *  title1: "Title",
 * 	title2: "Title 2"
 * },
 * ja:{
 * 	title1: "言語",
 * 	title2: "支払い可能"
 * }
 * 
 */
function formatWorkbookToObject(workbook) {

	let formatObject = {};

	workbook.SheetNames.forEach(sheetName => {
		const sheetObjectArrary = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
		console.log("____sheetObjectArrary:", sheetObjectArrary);
		for (let i = 0; i < sheetObjectArrary.length; i++) {

			const sheetObject = sheetObjectArrary[i];

			// set first variable as variable name
			let variableName = null;
			for (let key in sheetObject) {

				if (!variableName) {
					variableName = sheetObject[key];
				} else {

					if (!formatObject[key]) {
						formatObject[key] = {};
					}
					// check use arrary or object
					let content = sheetObject[key] ? sheetObject[key].split(/\n/) : [];

					if (content.length <= 1) {
						content = sheetObject[key];
					}

					// same variable
					variableName = checkSameVariableAndFormat(formatObject[key], variableName);
					formatObject[key][variableName] = content;
				}
			}
		}
	})

	return formatObject;
}

function checkSameVariableAndFormat(object, variableName) {
	if (object[variableName]) {
		return checkSameVariableAndFormat(object, variableName + "_s");
	} else {
		return variableName;
	}
}

function createOutputFile(fileContent) {
	// use 
	var data = new Blob([fileContent], { type: 'text/plain' });
	let outputFile = null;

	// If we are replacing a previously generated file we need to
	// manually revoke the object URL to avoid memory leaks.
	if (outputFile !== null) {
		window.URL.revokeObjectURL(outputFile);
	}

	outputFile = window.URL.createObjectURL(data);

	// returns a URL you can use as a href
	return outputFile;
};

function createOutputDownloadLink(formatObject) {

	// clean old link
	outputDom.innerHTML = '';

	for (let key in formatObject) {
		// output json file
		const outputContent = JSON.stringify(formatObject[key]);
		// output file name 
		const fileName = key + ".json"

		// create output dowload link
		let downloadLink = document.createElement("a");
		downloadLink.className = "downloadOption";
		downloadLink.href = createOutputFile(outputContent);

		downloadLink.download = fileName;
		downloadLink.text = fileName;
		outputDom.appendChild(downloadLink);
	}

	return;
}