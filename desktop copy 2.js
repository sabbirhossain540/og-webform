(function () {
  'use strict';

  /* ================= FontAwesome ================= */
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
  document.head.appendChild(fa);

  /* ================= CSS ================= */
  const style = document.createElement('style');
  style.innerHTML = `
    .custom-modal .modal-body { max-height:75vh; overflow:hidden; }
    .left-scroll,.right-scroll { max-height:60vh; overflow-y:auto; }

    .drag {
      cursor: grab;
      border: 1px dashed #ccc;
      background:#f8f9fa;
    }
    .drag.disabled {
      opacity:.4;
      pointer-events:none;
    }

    #fieldDropzone {
      min-height:67vh;
      border: 2px dashed #ffffff;
      border-radius: 6px;
      background: #e9e9e9;
    }

    
      

    .drop-item {
      border-left:4px solid #e1e1e1;
      background:#fff;
    }
  `;
  document.head.appendChild(style);

  let fieldProperties = [];
  let rowIndex = 0;
  let editRow = null;

  /* ================= Field Info ================= */
  function getFieldInfo() {
    return new Promise((resolve, reject) => {
      const names = [];
      kintone.api(
        kintone.api.url('/k/v1/app/form/fields.json', true),
        'GET',
        { app: kintone.app.getId() },
        res => {
          Object.entries(res.properties).forEach(([k, v]) => {
            names.push(k);
            fieldProperties.push(v);
          });
          resolve(names);
        },
        reject
      );
    });
  }

  function fieldTypeCheck(code) {
    const f = fieldProperties.find(x => x.code === code);
    return f ? f.type : '';
  }

  function typeWiseFieldGenerator(type){
        const groupSelectionTypeField = [ 'ORGANIZATION_SELECT', 'GROUP_SELECT', 'CATEGORY', 'MULTI_SELECT', 'CHECK_BOX', 'USER_SELECT', 'CREATOR', 'MODIFIER', 'STATUS_ASSIGNEE'];
        const dateTimeTypeField = ['CREATED_TIME', 'UPDATED_TIME', 'DATE', 'DATETIME', 'CREATED_AT', 'TIME'];
        const editorType = ['EDITOR'];


        const fieldType = fieldTypeCheck(type);



        if(editorType.includes(fieldType)){
            return `<textarea
                class="form-control mt-2"
                rows="3"
                placeholder="${type} field">
            </textarea>`;

        }

        if (groupSelectionTypeField.includes(fieldType)) {
            return `
                <select class="form-control mt-2">
                <option value="" disabled selected>
                    Select ${type}
                </option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                </select>
            `;
        }

        if (dateTimeTypeField.includes(fieldType)) {
            return `
                <label class="mt-2 mb-1 text-muted">Select date</label>
                <input type="date"
                    class="form-control" />
            `;
        }

        return `<input type="text"
                        class="form-control mt-2"
                        placeholder="${type} field"/>`;
    }

  /* ================= Bind Drop Item Events ================= */
  function bindDropItemEvents(field) {

    const code = field.data('code');

    // remove
    field.find('.remove').off().on('click', () => {
      field.remove();
      $(`.drag:contains("${code}")`).removeClass('disabled');
    });

    // title edit
    field.find('.edit-title').off().on('click', e => {
      e.stopPropagation();
      field.find('.title-text,.edit-title').addClass('d-none');
      field.find('.title-input').removeClass('d-none').focus();
    });

    field.find('.title-input').off().on('blur keydown', function (e) {
      if (e.type === 'blur' || e.key === 'Enter') {
        const v = $(this).val() || code;
        field.find('.title-text').text(v).removeClass('d-none');
        field.find('.edit-title').removeClass('d-none');
        $(this).addClass('d-none');
      }
    });
  }

  /* ================= Dropzone ================= */
  function initDropzone(selector) {

    $('.drag:not(.disabled)').draggable({
      helper: 'clone',
      appendTo: 'body',
      zIndex: 10000,
      revert: 'invalid'
    });

    $(selector).droppable({
      accept: '.drag:not(.disabled)',
      drop: function (e, ui) {
        console.log(e);
        console.log(ui);
        const code = ui.draggable.text();
        ui.draggable.addClass('disabled');

        const field = $(`
          <div class="drop-item p-2 mb-2" data-code="${code}">
            <div class="d-flex align-items-center mb-1">
              <strong class="title-text mr-2">${code}</strong>
              <input class="form-control form-control-sm title-input d-none"
                     value="${code}" style="width:160px">
              <button class="btn btn-sm edit-title">
                <i class="fa fa-edit"></i>
              </button>
            </div>
            ${typeWiseFieldGenerator(code)}

            <button class="btn btn-sm btn-outline-danger mt-2 remove">
              X
            </button>
          </div>
        `);

        bindDropItemEvents(field);
        $(selector).append(field);
      }
    }).sortable({ items: '.drop-item' });
  }

  /* ================= Kintone Event ================= */
  kintone.events.on('app.record.index.show', async function (event) {

    if (document.getElementById('webformConfigBtn')) return event;

    const fields = await getFieldInfo();
    const fieldHtml = fields.map(f =>
      `<div class="drag btn btn-light btn-block mb-2">${f}</div>`
    ).join('');

    kintone.app.getHeaderSpaceElement().insertAdjacentHTML('beforeend', `
      <button id="webformConfigBtn"
        class="btn btn-warning ml-3 mb-3"
        data-toggle="modal"
        data-target="#mainModal">
        Webform Configuration
      </button>
    `);

    /* MAIN MODAL */
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="mainModal">
        <div class="modal-dialog modal-xl custom-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Webform Configuration</h5>
              <button class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <button id="addRowBtn" class="btn btn-success btn-sm mb-2">
                <i class="fa fa-plus"></i> Add
              </button>
              <table class="table table-bordered table-sm">
                <thead>
                  <tr><th>#</th><th>Preview</th><th>Action</th></tr>
                </thead>
                <tbody id="configTable"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `);

    /* FIELD MODAL */
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="fieldConfigModal">
        <div class="modal-dialog modal-xl custom-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Configure Fields</h5>
              <button class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-4 border-right">
                  <h6>Fields</h6>
                  <div id="fieldList" class="left-scroll">${fieldHtml}</div>
                </div>
                <div class="col-md-8">
                  <h6>Form Preview</h6>
                  <div id="fieldDropzone" class="right-scroll p-2">
                    <p class="text-muted">Drop fields here</p>
                    
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="saveField" class="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    `);

    /* ADD */
    document.getElementById('addRowBtn').onclick = () => {
      editRow = null;
      $('#fieldDropzone').html('<p class="text-muted">Drop fields here</p> ');
      $('#fieldList .drag').removeClass('disabled');
      $('#fieldConfigModal').modal('show');
    };

    /* SAVE */
    document.getElementById('saveField').onclick = () => {
      const html = $('#fieldDropzone').html();
      if (!html.includes('drop-item')) return alert('Add at least one field');

      if (editRow) {
        editRow.children[1].innerHTML = html;
      } else {
        rowIndex++;
        document.getElementById('configTable').insertAdjacentHTML('beforeend', `
          <tr>
            <td>${rowIndex}</td>
            <td>${html}</td>
            <td>
              <button class="btn btn-info btn-sm editRow">
                <i class="fa fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm deleteRow">
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>
        `);
      }
      $('#fieldConfigModal').modal('hide');
    };

    /* EDIT / DELETE */
    document.addEventListener('click', e => {

      if (e.target.closest('.editRow')) {
        editRow = e.target.closest('tr');

        $('#fieldDropzone').html(editRow.children[1].innerHTML);

        $('#fieldList .drag').removeClass('disabled');

        $('#fieldDropzone .drop-item').each(function () {
          const code = $(this).data('code');
          $(`.drag:contains("${code}")`).addClass('disabled');
          bindDropItemEvents($(this)); 
        });

        $('#fieldConfigModal').modal('show');
      }

      if (e.target.closest('.deleteRow')) {
        e.target.closest('tr').remove();
      }
    });

    $('#fieldConfigModal').on('shown.bs.modal', () => {
      initDropzone('#fieldDropzone');
    });

    return event;
  });

})();
