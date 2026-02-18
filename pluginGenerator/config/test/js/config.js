(function(PLUGIN_ID) {
  "use strict";

  $(async function () {

    let table = $('#formTable').DataTable({
      searching: false,
      lengthChange: false,
      info: false ,
      columnDefs: [
        {
          targets: [1, 2],
          visible: false
        }
      ]
    });
    let rowCount = 1;
    let fieldProperties = [];
    let editRowIndex = null;
    let editItemId;
    let recordId;
    

    const actionButtons = `
          <button class="btn btn-primary btn-sm editBtn">Edit</button>
          <button class="btn btn-danger btn-sm deleteBtn">Delete</button>
        `;


    const config = kintone.plugin.app.getConfig(PLUGIN_ID);

    /* --------------------------------
       Get Kintone Field Info
    -------------------------------- */
    async function getFieldInfo() {

      const resp = await kintone.api(
        kintone.api.url('/k/v1/app/form/fields.json', true),
        'GET',
        { app: kintone.app.getId() }
      );

      fieldProperties = Object.values(resp.properties);

      return fieldProperties.map(f => ({
        code: f.code,
        type: f.type,
        label: f.label
      }));
    }

    /* --------------------------------
       Generate Input by Type
    -------------------------------- */
    function generateInput(type, customClass = '') {

      if (type === 'SINGLE_LINE_TEXT') {
        return `<input type="text" class="form-control ${customClass}">`;
      }

      if (type === 'NUMBER') {
        return `<input type="number" class="form-control ${customClass}">`;
      }

      if (type === 'MULTI_LINE_TEXT') {
        return `<textarea class="form-control ${customClass}" rows="3"></textarea>`;
      }

      return `<input type="text" class="form-control ${customClass}">`;
    }


    /* --------------------------------
       Load Fields into Left Panel
    -------------------------------- */
    try {

      const fields = await getFieldInfo();

      const fieldHtml = fields.map(f =>
        `<div class="field-item btn btn-light btn-block mb-2"
             data-code="${f.code}"
             data-type="${f.type}">
           ${f.label} (${f.code})
         </div>`
      ).join('');

      $('#fieldList').html(fieldHtml);

      // Initialize draggable AFTER dynamic load
      $('.field-item').draggable({
        helper: 'clone',
        revert: 'invalid',
        zIndex: 1000
      });

    } catch (err) {
      console.error("Field load error:", err);
    }

    /* --------------------------------
       Load Saved Config
    -------------------------------- */
    if (config.forms) {
      const forms = JSON.parse(config.forms);

      forms.forEach(form => {
        table.row.add([
          rowCount++,
          JSON.stringify(form),
          '<button class="btn btn-danger btn-sm deleteBtn">Delete</button>'
        ]).draw(false);
      });
    }


    async function getDataByKintoneAppId(kintoneAppId) {
      try {
        const response = await fetch(
          `https://1frg78a4ae.execute-api.ap-northeast-3.amazonaws.com/dev/app/${kintoneAppId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        // HTTP error handle
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server Error: ${errorText}`);
        }

        const data = await response.json();

        console.log("Data received:", data);

        return data;

      } catch (error) {
        console.error("Fetch error :", error.message);
        alert("Failed to load data: " + error.message);
        return null;
      }
    }

    function generatePreviewCard(mainData, jsonString) {
      console.log(mainData);
      const fields = JSON.parse(jsonString);

      let fieldsHTML = '';

      fields.forEach(field => {
        fieldsHTML += `
          <span class="preview-badge">
            ${field.label}
          </span>
        `;
      });

      return `
        <div class="preview-card">

          <div class="preview-header">
            ${mainData.title || 'Untitled App'}
          </div>

          <div class="preview-body">

            <div class="preview-row">
              <strong>Description:</strong> ${mainData.description || '-'}
            </div>

            <div class="preview-row">
              <strong>App directory:</strong> ${mainData.directory || '-'}
            </div>

            <div class="preview-row">
              <strong>URL:</strong> 
              <a href="${mainData.url}" target="_blank">
                ${mainData.appUrl || 'none'}
              </a>
            </div>

            <div class="preview-fields">

              <div class="preview-section-title">
                Selected Fields 
              </div>

              <div class="preview-field-list">
                ${fieldsHTML}
              </div>

            </div>


          </div>

        </div>
      `;
    }


    $( document ).ready(async function() {

        let getData = await getDataByKintoneAppId(kintone.app.getId());

        getData.map((element) =>{
          let editedData = [];
          let mainData = {
            "apiKey": element.apiKey,
            "description": element.description,
            "title": element.title,
            "appUrl": element.appUrl,
            "id": element.id,
            "directory": element.directory
          };
          
          element.fields.map((elem)=>{
            editedData.push(elem);
          });


          table.row.add([
            rowCount++,
            JSON.stringify(editedData),
            JSON.stringify(mainData),
            generatePreviewCard(mainData, JSON.stringify(element.fields)),
            actionButtons
          ]).draw(false);
        });
        
    });

    /* --------------------------------
       Open Modal
    -------------------------------- */
    $('#addRowBtn').click(function () {

      $('#dropzone').empty();

      // Clear all disabled first
      $('.field-item').removeClass('disabled-field');

      addFieldToDropzone('app_title', 'SINGLE_LINE_TEXT', 'Title *', false, 'app_title_input');
      addFieldToDropzone('description', 'MULTI_LINE_TEXT', 'Description', false, 'app_description_input');
      addFieldToDropzone('api_key', 'SINGLE_LINE_TEXT', 'API Key *', false, 'app_api_key_input');
      $('#dropzone').append('<div class="text-muted mt-1 mb-1">Drag available field and drop it here.</div>');

      $('#formBuilderModal').modal('show');
    });


    function addFieldToDropzone(code, type, label = code, deleteOption = true, customCluss = null) {

      $('.field-item[data-code="' + code + '"]')
        .addClass('disabled-field');

      const deleteBtn = deleteOption ? `
          <span class="remove-field text-danger ml-auto"
                style="cursor:pointer;font-size:14px;">
                ✖
          </span>
      ` : '';

      const editButton = deleteOption ? `
          <span class="edit-field text-primary ml-1"
                    style="cursor:pointer;font-size:14px;">
                    ✏️
              </span>
      ` : '';

      const fieldHTML = `
        <div class="dropped-item mb-3 p-3 border rounded bg-light"
            data-code="${code}"
            data-type="${type}">

          <div class="d-flex align-items-center mb-2">

            <div class="title-section d-flex align-items-center">

              <span class="field-text font-weight-bold">
                ${label}
              </span>

              ${editButton}

              <input type="text"
                    class="field-input form-control form-control-sm ml-1"
                    value="${label}"
                    style="display:none; width:180px;">

            </div>

            ${deleteBtn}

          </div>

          <div class="form-group mb-0">
            ${generateInput(type, customCluss)}
          </div>

        </div>
      `;

      console.log(fieldHTML);

      $('#dropzone').append(fieldHTML);
    }

    




    $('#dropzone').droppable({
      accept: '.field-item:not(.disabled-field)',
      drop: function (event, ui) {

        const code = ui.draggable.data('code');
        const type = ui.draggable.data('type');

        addFieldToDropzone(code, type, code);

      }
    });

    /* --------------------------------
       Sortable
    -------------------------------- */
    $('#dropzone').sortable({
      placeholder: "ui-state-highlight"
    });

    /* --------------------------------
       Remove Field
    -------------------------------- */
    $('#dropzone').on('click', '.remove-field', function () {

      const droppedItem = $(this).closest('.dropped-item');
      const code = droppedItem.data('code');

      $('.field-item[data-code="' + code + '"]')
        .removeClass('disabled-field');

      droppedItem.remove();

    });


    /* ------------------------------
        Edit Icon Click
      ------------------------------ */
      $('#dropzone').on('click', '.edit-field', function () {

        const section = $(this).closest('.title-section');

        section.find('.field-text').hide();
        section.find('.edit-field').hide();

        section.find('.field-input')
              .show()
              .focus();

      });


      /* ------------------------------
        When Click Outside / Blur
      ------------------------------ */
      $('#dropzone').on('blur', '.field-input', function () {

        const section = $(this).closest('.title-section');
        const newValue = $(this).val();

        section.find('.field-text')
              .text(newValue)
              .show();

        section.find('.edit-field').show();

        $(this).hide();

      });




      /* Auto lock when focus out */
      $('#dropzone').on('blur', '.field-label', function () {
        $(this).prop('readonly', true)
              .removeClass('editing');
      });


      /* Auto stop editing when focus out */
      $('#dropzone').on('blur', '.field-label', function () {
        $(this).prop('readonly', true)
              .removeClass('editing');
      });

    

    /* --------------------------------
        Save Form
      -------------------------------- */


      async function awsDataStoreManagement(data, editItemId) {
        const body = {
          title: data.title,
          apiKey: data.apiKey,
          kintoneAppId: kintone.app.getId(),
          description: data.description,
          directory: data.directory,
          fields: data.fields
        };

        if(editItemId != undefined){
          body.id = editItemId;
        }

        try {
          const response = await fetch(
            "https://1frg78a4ae.execute-api.ap-northeast-3.amazonaws.com/dev/submit",
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json"
              },
              body: JSON.stringify(body)
            }
          );

          const result = await response.json();

          if (!response.ok) {
            console.error("API Error:", result);
            return;
          }

          console.log("Success:", result);

        } catch (error) {
          console.error("Fetch failed:", error);
          alert("❌ Network / CORS error occurred");
        }
      }


      async function handleDeleteItem(id) {
        try {
          const response = await fetch(
            `https://1frg78a4ae.execute-api.ap-northeast-3.amazonaws.com/dev/item/${id}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("Delete failed");
          }

          const result = await response.json();
          console.log("Deleted successfully:", result);

          return true;

        } catch (error) {
          console.error("Error deleting item:", error);
          return false;
        }
      }



      $('#saveFormBtn').click(function () {
         // Remove old errors
          $('.validation-error').remove();
          $('.is-invalid').removeClass('is-invalid');

          let isValid = true;

          const titleInput = $('.app_title_input');
          const apiKeyInput = $('.app_api_key_input');

          if (!titleInput.val().trim()) {
            titleInput.addClass('is-invalid');
            titleInput.after('<div class="validation-error text-danger small mt-1">Title is required</div>');
            isValid = false;
          }

          if (!apiKeyInput.val().trim()) {
            apiKeyInput.addClass('is-invalid');
            apiKeyInput.after('<div class="validation-error text-danger small mt-1">API Key is required</div>');
            isValid = false;
          }

          if (!isValid) {
            return; // Stop form save
          }

        let fields = [];
        let editField = [];
        
        let getDirectory = generateRandomCode();

        let data = {
          "title": $('.app_title_input').val(),
          "description": $('.app_description_input').val(),
          "directory": getDirectory,
          "apiKey": $('.app_api_key_input').val(),
          "fields": fields
        }

        let mainData = {
            "apiKey": $('.app_api_key_input').val(),
            "description": $('.app_description_input').val(),
            "title": $('.app_title_input').val(),
            "directory": getDirectory
          };

          if(recordId != undefined || recordId != ''){
            mainData['id'] = recordId;
          }

        $('#dropzone .dropped-item').each(function () {

          const code = $(this).data('code');

          if (
            code !== "app_title" &&
            code !== "description" &&
            code !== "api_key"
          ) {
            fields.push({
              code: code,
              type: $(this).data('type'),
              label: $(this).find('.field-text').text().trim()
            });

            editField.push({
              code: code,
              type: $(this).data('type'),
              label: $(this).find('.field-text').text().trim()
            });
          }

        });

        if (!fields.length) {
          alert("Add at least one field");
          return;
        }

        

        if (editRowIndex !== null) {
          console.log(editRowIndex);
          table.row(editRowIndex).data([
            editRowIndex + 1,
            JSON.stringify(editField),
            JSON.stringify(mainData),
            generatePreviewCard(mainData, JSON.stringify(fields)),
            actionButtons
          ]).draw(false);

          editRowIndex = null;

        } else {
          table.row.add([
            rowCount++,
            JSON.stringify(editField),
            JSON.stringify(mainData),
            generatePreviewCard(mainData, JSON.stringify(fields)),
            actionButtons
          ]).draw(false);

        }

        console.log(editField);
        console.log(fields);

        awsDataStoreManagement(data, editItemId);

        $('#formBuilderModal').modal('hide');
      });



      function generateRandomCode(length = 10) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";

        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * chars.length);
          result += chars[randomIndex];
        }

        return result;
      }

    /* --------------------------------
        Edit Row
      -------------------------------- */
      $('#formTable tbody').on('click', '.editBtn', function () {
   
        const row = table.row($(this).parents('tr'));
        const rowData = row.data();

        console.log(rowData);

        editRowIndex = row.index();

        const fields = JSON.parse(rowData[1]);
        const mainDataFields = JSON.parse(rowData[2]);
        console.log(mainDataFields);

        // Clear old dropzone
        $('#dropzone').empty();

        // Enable all left panel fields first
        $('.field-item').removeClass('disabled-field');

        addFieldToDropzone('app_title', 'SINGLE_LINE_TEXT', 'Title *', false, 'app_title_input');
        addFieldToDropzone('description', 'MULTI_LINE_TEXT', 'Description', false, 'app_description_input');
        addFieldToDropzone('api_key', 'SINGLE_LINE_TEXT', 'API Key *', false, 'app_api_key_input');

        // Re-add saved fields
        fields.forEach(field => {
          console.log(field);
          addFieldToDropzone(field.code, field.type, field.label);
        });

        $(".app_title_input").val(mainDataFields['title']);
        $(".app_description_input").val(mainDataFields['description']);
        $(".app_api_key_input").val(mainDataFields['apiKey']);
        recordId = mainDataFields['id'];
        editItemId = mainDataFields['id'];

        $('#formBuilderModal').modal('show');
      });



    /* --------------------------------
       Delete Row
    -------------------------------- */
    $('#formTable').on('click', '.deleteBtn', function () {
      const row = table.row($(this).parents('tr'));
      const rowData = row.data();
      const mainDataFields = JSON.parse(rowData[2]);
      let response = handleDeleteItem(mainDataFields.id);
      if(response){
        row.remove().draw();
      }
    });

    /* --------------------------------
       Save Plugin Config
    -------------------------------- */
    $('#saveConfig').click(function () {

      let configData = [];

      table.rows().every(function () {
        configData.push(JSON.parse(this.data()[1]));
      });

      kintone.plugin.app.setConfig({
        forms: JSON.stringify(configData)
      });

      alert("Saved Successfully!");
    });

  });

})(kintone.$PLUGIN_ID);
