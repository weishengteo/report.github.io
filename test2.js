let stockfile = document.getElementById('stockdocpicker');
let sofile = document.getElementById('sodocpicker');
let pofile = document.getElementById('podocpicker');
let viewer = document.getElementById('dataviewer');

let description = {};
let stockresult = {};
let soresult = {};
let poresult = {};

let track;

stockfile.addEventListener('change', function(){
  showLoading();
  track = "stock";
});
stockfile.addEventListener('change', main);

sofile.addEventListener('change', function(){
  showLoading();
  track = "salesorder";
});
sofile.addEventListener('change', main);

pofile.addEventListener('change', function(){
  showLoading();
  track = "purchaseorder";
});
pofile.addEventListener('change', main);

function main(evt){
  importFile(evt).then(function(){
    displayTable();
  })
}

function showLoading(){
  $("#coverScreen").show();
  // document.getElementById("loading_gif").style = "visibility: visible";
}

function hideLoading(){
  $("#coverScreen").hide();
  // document.getElementById("loading_gif").style = "visibility: hidden";
}

function importFile(evt) {
  return new Promise(function(resolve, reject){
    var f = evt.target.files[0];

    if (f) {
      var r = new FileReader();
      r.onload = e => {
        var contents = processExcel(e.target.result);
        // console.log(contents);
        if (track == "stock"){
          for (let i = 1; i < contents["Item"].length - 1; i++){
            // console.log("yes")
            if(contents["Item"][i].length <= 1){continue;}

            stockresult[contents["Item"][i][0]] = contents["Item"][i];
            if (description[contents["Item"][i][1]]){
              description[contents["Item"][i][1]].push(contents["Item"][i][0]);
            }
            else{
              if(contents["Item"][i][0]){
                description[contents["Item"][i][1]] = [contents["Item"][i][0]];
              }
            }
          }
        }
        else if(track == "salesorder"){
          for (let i = 1; i < contents["Sheet1"].length - 1; i++){
            // console.log("yes")
            if (soresult[contents["Sheet1"][i][5]]){
              soresult[contents["Sheet1"][i][5]].push(contents["Sheet1"][i])
            }
            else{
              if (contents["Sheet1"][i][0]){
                soresult[contents["Sheet1"][i][5]] = [contents["Sheet1"][i]];
              }
            }
          }
        }
        else if (track == "purchaseorder"){
          for (let i = 1; i < contents["Sheet1"].length - 1; i++){
            // console.log("yes")
            if (poresult[contents["Sheet1"][i][4]]){
              poresult[contents["Sheet1"][i][4]].push(contents["Sheet1"][i])
            }
            else{
              if (contents["Sheet1"][i][0]){
                poresult[contents["Sheet1"][i][4]] = [contents["Sheet1"][i]];
              }
            }
          }
        }
        resolve();
      }
      r.readAsBinaryString(f);
    } else {
      console.log("Failed to load file");
    }
  })

}

function processExcel(data) {
  var workbook = XLSX.read(data, {
    type: 'binary'
  });

  var firstSheet = workbook.SheetNames[0];
  var data = to_json(workbook);
  return data
};

function to_json(workbook) {
  var result = {};
  workbook.SheetNames.forEach(function(sheetName) {
    var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1
    });
    if (roa.length) result[sheetName] = roa;
  });
  return result;
};

function searchByCode() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    if (tr[i].getElementsByTagName("td")[0]){
      tdCategoryId = tr[i].getElementsByTagName("td")[0].id;
      if (tdCategoryId != ""){
        if (tdCategoryId.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
      else{
        td = tr[i].getElementsByTagName("td")[1];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            tr[i].style.display = "";
          } else {
            tr[i].style.display = "none";
          }
        }
      }
    }
  }
}

let output = "";

function displayTable(){
  // Declare variables
  // console.log("try")
  let num = 1;

  // If Stock results, Sales order results and product order results are ready
  if (Object.keys(stockresult).length != 0 && Object.keys(soresult).length != 0 && Object.keys(poresult).length != 0){
    output += '<table id="myTable"><thead><tr class="header"><th style="width:10%;">Number</th><th style="width:10%;">Stock Code</th><th style="width:10%;">Description</th><th style="width:10%;">Size</th><th style="width:10%;">Current Stock</th><th style="width:10%;">Indent PO</th><th style="width:10%;">ETA</th>'
    output += '<th style="width:10%;">Total Stock</th><th style="width:10%;">Total SO</th><th style="width:10%;">Balance Stock</th></tr></thead><tbody>'
    let last = Object.keys(stockresult)[Object.keys(stockresult).length-1];

    for(desc in description){
      for(let j = 0; j < description[desc].length; j++){
        i = description[desc][j];
        // Declare variables to be used in the table
        let size = "---", indentPo = 0, eta = "---", totalStock = 0, totalSo = 0, balanceStock = 0;
        // Assign size if it is not undefined
        if(stockresult[i][2]){
          size = stockresult[i][2]
        }

        // If the item has a purchasing order and sales order
        if(poresult[i] && soresult[i]){
          eta = poresult[i][0][8];
          for(k in poresult[i]){
            indentPo += poresult[i][k][12];
          }
          totalStock = stockresult[i][5] + indentPo;
          for(k in soresult[i]){
            totalSo += soresult[i][k][11];
          }
          balanceStock = stockresult[i][5] + indentPo - totalSo;
        }
        // If the item has a purchasing order but no sales order
        else if (poresult[i] && !soresult[i]){
          eta = poresult[i][0][8];
          for(k in poresult[i]){
            indentPo += poresult[i][k][12];
          }
          totalStock = stockresult[i][5] + indentPo;
          balanceStock = stockresult[i][5] + indentPo - totalSo;
        }
        // If the item has no purchasing order but has sales order
        else if (!poresult[i] && soresult[i]){
          totalStock = stockresult[i][5] + indentPo;
          for(k in soresult[i]){
            totalSo += soresult[i][k][11];
          }
          balanceStock = stockresult[i][5] + indentPo - totalSo;
        }
        // If the item has no purchasing order nor sales order
        else{
          totalStock = stockresult[i][5] + indentPo;
          balanceStock = stockresult[i][5] + indentPo - totalSo;
        }

        // Print out the table
        output += "<tr>"
        output += "<td>" + num + "</td>"
        output += "<td>" + i + "</td>"
        output += "<td style='background-color:#42f5d7'>" + desc + "</td>"
        output += "<td>" + size + "</td>"
        output += "<td>" + stockresult[i][5] + "</td>"
        output += "<td>" + indentPo + "</td>"
        output += "<td>" + eta + "</td>"
        output += "<td>" + totalStock + "</td>"
        output += "<td>" + totalSo + "</td>"
        // Change the background color to negative if the balance stock has a negative value
        if(balanceStock >= 0){
          output += "<td>" + balanceStock + "</td>"
        }
        else{
          output += "<td style='background-color:#FF0000'>" + balanceStock + "</td>"
        }
        output += "</tr>"
        num++;

        // console.log(i == last)
        if (i == last){
          output += "</tbody>"
          output += "</table>"
          // console.log( i == last)
          viewer.innerHTML = output;
          $('#myTable').DataTable( {
              "pagingType": "full_numbers",
              dom: 'Bl<"toolbar">frtip',
              buttons: [
                {extend: 'copy',
                 exportOptions: {
                 columns: ':visible',
                   rows: ':visible'
                  }
                 },
                {extend: 'csv',
                 exportOptions: {
                 columns: ':visible',
                   rows: ':visible'
                  }
                 },
                {extend: 'excel',
                 exportOptions: {
                 columns: ':visible',
                   rows: ':visible'
                  }
                 },
                 {extend: 'pdf',
                  exportOptions: {
                  columns: ':visible',
                    rows: ':visible'
                   }
                  },
                  {extend: 'print',
                   exportOptions: {
                   columns: ':visible',
                     rows: ':visible'
                    }
                   }
              ],
              "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
          } );
          $("div.toolbar").html('&nbsp;&nbsp;&nbsp;&nbsp;<b> #Note: Copy, CSV, Excel, PDF, and Print buttons work on the current state of the table</b>');
          hideLoading();
        }

      }
    }
  }
  else{
    hideLoading();
  }
}

// Display name of file uploaded on respective text blocks
document.getElementById("stockdocpicker").onchange = function () {
    document.getElementById("uploadStockDoc").value = this.files[0].name;
};

document.getElementById("podocpicker").onchange = function () {
    document.getElementById("uploadPoDoc").value = this.files[0].name;
};

document.getElementById("sodocpicker").onchange = function () {
    document.getElementById("uploadSoDoc").value = this.files[0].name;
};

// Hide loading screen by default
$("#coverScreen").hide();
