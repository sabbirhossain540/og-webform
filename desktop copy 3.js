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
    .drag { cursor: grab; border:1px dashed #ccc; background:#f8f9fa; }
    .drag.disabled { opacity:.4; pointer-events:none; }
    #fieldDropzone { min-height:65vh; border:2px dashed #ddd; background:#eee; }
    .drop-item { background:#fff; border-left:4px solid #ccc; }
  `;
  document.head.appendChild(style);

  let fieldProperties = [];
  let rowIndex = 0;
  let editRow = null;
  let mainDirectory;

  /* ================= Field Info ================= */
  function getFieldInfo() {
    return new Promise((resolve, reject) => {
      const names = [];
      kintone.api(
        kintone.api.url('/k/v1/app/form/fields.json', true),
        'GET',
        { app: kintone.app.getId() },
        res => {
          Object.values(res.properties).forEach(v => {
            names.push(v.code);
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

  /* ================= Field Generator ================= */
  function typeWiseFieldGenerator(code) {
    const type = fieldTypeCheck(code);

    if (type === 'EDITOR') {
      return `<textarea class="form-control mt-1" rows="2"></textarea>`;
    }

    if (['DATE', 'DATETIME', 'TIME'].includes(type)) {
      return `<input type="date" class="form-control mt-1">`;
    }

    if (['CHECK_BOX', 'MULTI_SELECT', 'CATEGORY', 'USER_SELECT'].includes(type)) {
      return `<select class="form-control mt-1"><option>Select ${code}</option></select>`;
    }

    return `<input type="text" class="form-control mt-1">`;
  }

  /* ================= Form Title ================= */

  function initFormTitle() {
    if ($('#fieldDropzone .form-title-wrapper').length) return;

    $('#fieldDropzone').prepend(`
      <div class="form-title-wrapper mb-3">
        <label class="font-weight-bold">
          Application Title <span class="text-danger">*</span>
        </label>
        <input type="text"
          class="form-control form-title-input"
          placeholder="Enter form title">
        <small class="text-danger error-title d-none">
          Application Title is required
        </small>
      </div>

      <div class="form-title-wrapper mb-3">
        <label class="font-weight-bold">Description</label>
        <textarea class="form-control form-description-input"></textarea>
      </div>
    `);
  }



  /* ================= Field Events ================= */
  function bindDropItemEvents(field) {
    const code = field.data('code');

    /* Remove */
    field.find('.remove').off().on('click', function () {
      field.remove();
      $(`.drag:contains("${code}")`).removeClass('disabled');
    });

    /* Edit field title */
    field.find('.edit-field-title').off().on('click', function () {
      field.find('.field-title-text').addClass('d-none');
      field.find('.field-title-input').removeClass('d-none').focus();
      $(this).addClass('d-none');
    });

    field.find('.field-title-input').off().on('blur keydown', function (e) {
      if (e.type === 'blur' || e.key === 'Enter') {
        const v = $(this).val().trim() || code;
        field.find('.field-title-text').text(v).removeClass('d-none');
        field.find('.edit-field-title').removeClass('d-none');
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
        initFormTitle();

        const code = ui.draggable.text().trim();
        const type = fieldTypeCheck(code);
        ui.draggable.addClass('disabled');

        const field = $(`
          <div class="drop-item p-2 mb-2"
            data-code="${code}"
            data-type="${type}">

            <div class="d-flex align-items-center mb-1">
              <strong class="field-title-text mr-2">${code}</strong>

              <input type="text"
                class="form-control form-control-sm field-title-input d-none"
                value="${code}"
                style="width:160px">

              <button class="btn btn-sm btn-link edit-field-title">
                <i class="fa fa-edit"></i>
              </button>
            </div>

            ${typeWiseFieldGenerator(code)}

            <button class="btn btn-sm btn-outline-danger mt-2 remove">X</button>
          </div>
        `);

        bindDropItemEvents(field);
        $(this).append(field);
      }
    }).sortable({ items: '.drop-item' });
  }

  function generateRandomCode(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    return result;
  }



  /* ================= Collect Config ================= */

  function collectFormConfig() {
    const title = $('.form-title-input').val().trim();
    const description = $('.form-description-input').val().trim();
    let directory = generateRandomCode(10);;
    if(editRow != null){
      directory = mainDirectory;
    }
    
    const fields = [];

    let hasError = false;

    // reset previous errors
    $('.error-title, .error-directory').addClass('d-none');
    $('.form-title-input, .form-directory-input').removeClass('is-invalid');

    // Title validation
    if (!title) {
      $('.error-title').removeClass('d-none');
      $('.form-title-input').addClass('is-invalid');
      hasError = true;
    }

    // যদি error থাকে → data return করবে না
    if (hasError) {
      return null;
    }

    // fields collect
    $('#fieldDropzone .drop-item').each(function () {
      fields.push({
        code: $(this).data('code'),
        type: $(this).data('type'),
        label: $(this).find('.field-title-text').text()
      });
    });

    return {
      title,
      description,
      directory,
      fields
    };
  }


  /* ================= Preview ================= */
  function renderPreview(cfg) {
    let generatedUrl = `www.amazon.com/s3/${cfg.directory}/index.html`;
  return `
    <div class="preview-header mb-4">
      <div class="mb-2">
        <strong>App Title:</strong>
        <span class="text-primary">${cfg.title}</span>
      </div>

      <div class="mb-2">
        <i>App Directory:</i>
        <span class="text-muted">${cfg.directory}</span>
      </div>
      <div class="mb-2">
        <i>App URL:</i>
        <span class="text-muted"><a href="${generatedUrl}" target="blank">${generatedUrl}</a></span>
      </div>
    </div>

    <div class="preview-fields">
      ${cfg.fields.map(f => `
        <div class="mt-3">
          <label class="font-weight-bold d-block mb-1">
            ${f.label}
          </label>
          ${typeWiseFieldGenerator(f.code)}
        </div>
      `).join('')}
    </div>
  `;
}


  /* ================= Kintone ================= */
  kintone.events.on('app.record.index.show', async event => {
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
                <i class="fa fa-plus"></i> Add Form
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
                  <div id="fieldList" class="left-scroll">${fieldHtml}</div>
                </div>
                <div class="col-md-8">
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

    document.getElementById('addRowBtn').onclick = () => {
      editRow = null;
      $('#fieldDropzone').html('<p class="text-muted">Drop fields here</p>');
      $('#fieldList .drag').removeClass('disabled');
      $('#fieldConfigModal').modal('show');
    };

    document.getElementById('saveField').onclick = () => {
      const cfg = collectFormConfig();
      console.log(cfg);
      if (!cfg.fields.length) return alert('Add at least one field');

      if (editRow) {
        editRow.dataset.config = JSON.stringify(cfg);
        editRow.children[1].innerHTML = renderPreview(cfg);
      } else {
        rowIndex++;
        $('#configTable').append(`
          <tr data-config='${JSON.stringify(cfg)}'>
            <td>${rowIndex}</td>
            <td>${renderPreview(cfg)}</td>
            <td>
              <button class="btn btn-info btn-sm editRow"><i class="fa fa-edit"></i></button>
              <button class="btn btn-danger btn-sm deleteRow"><i class="fa fa-trash"></i></button>
            </td>
          </tr>
        `);
      }
      $('#fieldConfigModal').modal('hide');
    };

    document.addEventListener('click', e => {
      if (e.target.closest('.editRow')) {
        editRow = e.target.closest('tr');
        const cfg = JSON.parse(editRow.dataset.config);
        mainDirectory = cfg.directory;

        $('#fieldDropzone').empty();
        initFormTitle();
        $('.form-title-input').val(cfg.title);
        $('.form-description-input').val(cfg.description);

        $('#fieldList .drag').removeClass('disabled');

        cfg.fields.forEach(f => {
          $(`.drag:contains("${f.code}")`).addClass('disabled');

          const field = $(`
            <div class="drop-item p-2 mb-2"
              data-code="${f.code}"
              data-type="${f.type}">
              <div class="d-flex align-items-center mb-1">
                <strong class="field-title-text mr-2">${f.label}</strong>
                <input class="form-control form-control-sm field-title-input d-none" value="${f.label}">
                <button class="btn btn-sm btn-link edit-field-title"><i class="fa fa-edit"></i></button>
              </div>
              ${typeWiseFieldGenerator(f.code)}
              <button class="btn btn-sm btn-outline-danger mt-2 remove">X</button>
            </div>
          `);
          bindDropItemEvents(field);
          $('#fieldDropzone').append(field);
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
