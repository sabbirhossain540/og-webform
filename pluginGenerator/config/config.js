(function () {
  'use strict';

  // Open modal on Add Form click
  $('#addRowBtn').on('click', function () {
    $('#formBuilderModal').modal('show');
  });

  // Make fields draggable
  $('.field-item').draggable({
    helper: 'clone',
    revert: 'invalid'
  });

  // Make dropzone droppable
  $('#dropzone').droppable({
    accept: '.field-item',
    drop: function (event, ui) {

      const type = ui.draggable.data('type');

      let html = '';

      if (type === 'text') {
        html = '<input type="text" class="form-control mb-2" placeholder="Text Field">';
      }

      if (type === 'textarea') {
        html = '<textarea class="form-control mb-2" placeholder="Textarea"></textarea>';
      }

      if (type === 'number') {
        html = '<input type="number" class="form-control mb-2" placeholder="Number">';
      }

      $(this).append(`<div class="dropped-item">${html}</div>`);
    }
  });

  // Make dropzone sortable
  $('#dropzone').sortable();

})();
