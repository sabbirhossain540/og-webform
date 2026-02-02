(function () {
  'use strict';

  // ===============================
  // Load FontAwesome
  // ===============================
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
  document.head.appendChild(fa);

  // ===============================
  // Custom CSS for scroll
  // ===============================
  const style = document.createElement('style');
  style.innerHTML = `
    .custom-modal .modal-body {
      max-height: 75vh;
      overflow: hidden;
    }
    .left-scroll {
      max-height: 60vh;
      overflow-y: auto;
    }
    .right-scroll {
      max-height: 60vh;
      overflow-y: auto;
    }
    .drag {
      cursor: grab;
    }
  `;
  document.head.appendChild(style);

  // ===============================
  // Kintone index view
  // ===============================
  kintone.events.on('app.record.index.show', function (event) {

    if (document.getElementById('webformConfigBtn')) {
      return event;
    }

    // ===============================
    // Header button
    // ===============================
    const el = kintone.app.getHeaderSpaceElement();

    const btn = document.createElement('button');
    btn.id = 'webformConfigBtn';
    btn.className = 'btn btn-warning ml-3 mb-3';
    btn.innerHTML = '<i class="fas fa-compress mr-2"></i> Webform Configuration';
    btn.setAttribute('data-toggle', 'modal');
    btn.setAttribute('data-target', '#webformConfigModal');

    el.appendChild(btn);

    // ===============================
    // Modal HTML
    // ===============================
    if (!document.getElementById('webformConfigModal')) {

      const modalHtml = `
      <div class="modal fade"
           id="webformConfigModal"
           tabindex="-1"
           role="dialog"
           data-backdrop="static"
           data-keyboard="false">

        <div class="modal-dialog modal-xl modal-dialog-scrollable custom-modal" role="document">
          <div class="modal-content">

            <div class="modal-header">
              <h5 class="modal-title">Webform Configuration</h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="container-fluid">

                <!-- APP TITLE -->
                <div class="row mb-3">
                    <div class="col-md-12">
                    <h6>App Title</h6>
                    <input type="text"
                            name="app_title"
                            id="app_title"
                            class="form-control"
                            placeholder="App Title">
                    </div>
                </div>

                <!-- MAIN CONTENT -->
                <div class="row">

                    <!-- LEFT -->
                    <div class="col-md-4 border-right">
                    <h6>Fields</h6>
                    <div id="modules" class="left-scroll">
                        <div class="drag btn btn-light btn-block mb-2">Text</div>
                        <div class="drag btn btn-light btn-block mb-2">Textarea</div>
                        <div class="drag btn btn-light btn-block mb-2">Number</div>
                        <div class="drag btn btn-light btn-block mb-2">Email</div>
                        <div class="drag btn btn-light btn-block mb-2">Date</div>
                        <div class="drag btn btn-light btn-block mb-2">Dropdown</div>
                    </div>
                    </div>

                    <!-- RIGHT -->
                    <div class="col-md-8">
                    <h6>Form Preview</h6>
                    <div id="dropzone" class="border p-2 right-scroll">
                        <p class="text-muted">Drop fields here</p>
                    </div>
                    </div>

                </div>

                </div>

            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">
                Close
              </button>
              <button type="button" class="btn btn-primary">
                Save
              </button>
            </div>

          </div>
        </div>
      </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function typeWiseFieldGenerator(type){
        if(type == "Textarea"){
            return `<textarea
                class="form-control mt-2"
                rows="3"
                placeholder="${type} field">
            </textarea>`;

        }

        if (type == "Dropdown") {
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

        if (type == "Date") {
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

    // ===============================
    // Drag & Drop INIT
    // ===============================
    $('#webformConfigModal').on('shown.bs.modal', function () {

      if ($('.drag').data('ui-draggable')) {
        return;
      }

      $('.drag').draggable({
        helper: 'clone',
        appendTo: 'body',
        zIndex: 10000,
        cursor: 'move',
        revert: 'invalid'
      });

      $('#dropzone')
        .droppable({
            accept: '.drag',
            tolerance: 'pointer',
            hoverClass: 'bg-light',
            drop: function (e, ui) {

            const type = ui.draggable.text();

            const fieldTypeByCategory = typeWiseFieldGenerator(type);
            console.log(fieldTypeByCategory);

            const field = $(`
                <div class="drop-item border p-2 mb-2 bg-white">

                <div class="d-flex align-items-center justify-content-between">
                    <div class="field-title d-flex align-items-center">

                    <strong class="title-text mr-2">${type}</strong>

                    <input type="text"
                            class="form-control form-control-sm title-input d-none"
                            value="${type}"
                            style="width: 180px;">

                    <button class="btn edit-title">
                        <i class="fa fa-edit"></i>
                    </button>
                    </div>
                </div>

                ${fieldTypeByCategory}


                <button class="btn btn-sm btn-outline-danger mt-2 remove">
                    <i class="fa fa-trash"></i>
                </button>
                </div>
            `);

            // REMOVE FIELD
            field.find('.remove').on('click', function () {
                field.remove();
            });

            // ENABLE TITLE EDIT
            field.find('.edit-title').on('click', function (e) {
                e.stopPropagation(); // prevent drag conflict
                field.find('.title-text').addClass('d-none');
                field.find('.edit-title').addClass('d-none');
                field.find('.title-input').removeClass('d-none').focus();
            });

            // SAVE TITLE (blur / enter)
            field.find('.title-input').on('blur keydown', function (e) {
                if (e.type === 'blur' || e.key === 'Enter') {
                const val = $(this).val().trim() || type;
                field.find('.title-text').text(val).removeClass('d-none');
                field.find('.edit-title').removeClass('d-none');
                $(this).addClass('d-none');
                }
            });

            $('#dropzone').append(field);
            }
        })
        .sortable({
            items: '.drop-item',
            cursor: 'move'
        });



    });

    return event;
  });

})();
