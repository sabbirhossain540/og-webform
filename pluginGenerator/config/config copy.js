(async (PLUGIN_ID) => {
    'use strict';

    const escapeHtml = (htmlstr) => {
      return htmlstr
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '&#xA;');
    };

    const appId = kintone.app.getId();
    const apiFormData = document.getElementById('dropdown-setting-searchPluginStatus');
    const config = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (apiFormData) apiFormData.value = config.searchPluginStatus || '0';

    let statusIndex = 0;
    let statusList = [];
    let fieldOptions = [];
    const selectedStatuses = new Set();

    // Fetch process statuses
    async function fetchStatuses() {
        const body = { app: appId };
        try {
            const response = await kintone.api(kintone.api.url('/k/v1/app/status.json', true), 'GET', body);
            statusList = Object.keys(response.states || {});
        } catch (error) {
            console.error('Error fetching process statuses:', error);
        }
    }

    // Fetch field names
    async function fetchFields(lang = 'en') {
        try {
            const resp = await kintone.api(kintone.api.url("/k/v1/preview/app/form/fields", true), "GET", { app: appId, lang });
            const fields = Object.values(resp.properties || {});
            fieldOptions = fields.map(f => f.label || f.code);
        } catch (err) {
            console.error('Error fetching field info:', err);
        }
    }

    await fetchStatuses();
    await fetchFields();

    const container = document.getElementById('status-container');

    // Add new section
    function addSection(configData) {
        statusIndex++;

        const section = document.createElement('div');
        section.className = 'status-section';
        section.style.position = 'relative';
        section.style.border = '1px solid #ddd';
        section.style.margin = '10px 0';
        section.style.padding = '10px';

        const availableStatuses = statusList.filter(s => !selectedStatuses.has(s));
        const statusOptions = availableStatuses.map(status => `<option value="${status}">${status}</option>`).join('');
        const fieldOptionTags = fieldOptions.map(opt => `<div class="multi-item" data-value="${opt}">${opt}</div>`).join('');

        section.innerHTML = `
            <button type="button" class="remove-section-btn" style="
                position: absolute;
                top: 5px;
                right: 5px;
                background: transparent;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #999;">✕</button>
            <h4>Email Configuration ${statusIndex}</h4>
            <div class="kintoneplugin-row">
                <label>Status Name:</label>
                <select class="kintoneplugin-input-select status-dropdown">
                    <option value="">-- Select --</option>
                    ${statusOptions}
                </select>
            </div>
            <div class="kintoneplugin-row">
                <label>Email Title:</label>
                <input type="text" class="kintoneplugin-input-text email-title" placeholder="Enter email title">
            </div>
            <div class="kintoneplugin-row">
                <label>Email Body:</label>
                <textarea class="kintoneplugin-input-textarea email-body" rows="4" placeholder="Enter email body"></textarea>
            </div>
            <div class="kintoneplugin-row">
                <label>Multi-Select Fields:</label>
                <input type="text" class="kintoneplugin-input-text multi-display" readonly placeholder="Selected fields">
                <div class="multi-dropdown" style="border: 1px solid #ccc; padding: 5px; margin-top: 5px; max-height: 150px; overflow-y: auto;">
                    ${fieldOptionTags}
                </div>
            </div>
        `;

        // Populate the section with the existing config data (if available)
        if (configData) {
            const { status, emailTitle, emailBody, multiFields } = configData;
            section.querySelector('.status-dropdown').value = status || '';
            section.querySelector('.email-title').value = emailTitle || '';
            section.querySelector('.email-body').value = emailBody || '';
            section.querySelector('.multi-display').value = multiFields || '';
        }

        container.appendChild(section);

        const dropdown = section.querySelector('.status-dropdown');
        let prevSelected = '';

        dropdown.addEventListener('change', () => {
            const currentValue = dropdown.value;

            if (prevSelected) selectedStatuses.delete(prevSelected);
            if (currentValue) selectedStatuses.add(currentValue);

            prevSelected = currentValue;

            updateAllDropdowns();
        });

        // Remove section
        section.querySelector('.remove-section-btn').addEventListener('click', () => {
            const selected = dropdown.value;
            if (selected) selectedStatuses.delete(selected);
            container.removeChild(section);
            updateAllDropdowns();
        });

        // Multi-select field logic
        const multiDisplay = section.querySelector('.multi-display');
        const multiItems = section.querySelectorAll('.multi-item');
        const selectedItems = new Set();

        multiItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.style.padding = '4px';
            item.style.borderBottom = '1px solid #eee';

            item.addEventListener('click', () => {
                const value = item.dataset.value;
                if (selectedItems.has(value)) {
                    selectedItems.delete(value);
                    item.style.backgroundColor = '';
                } else {
                    selectedItems.add(value);
                    item.style.backgroundColor = '#d0ebff';
                }
                multiDisplay.value = Array.from(selectedItems).join(', ');
            });
        });
    }

    // Update all dropdowns when selections change
    function updateAllDropdowns() {
        const sections = container.querySelectorAll('.status-section');
        sections.forEach(sec => {
            const select = sec.querySelector('.status-dropdown');
            const current = select.value;

            const available = statusList.filter(status => {
                return status === current || !selectedStatuses.has(status);
            });

            select.innerHTML = `<option value="">-- Select --</option>` + available.map(
                s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`
            ).join('');
        });
    }

    // If configuration already exists, populate it in edit mode
    const sectionsData = config.sectionsDataJSON ? JSON.parse(config.sectionsDataJSON) : [];
    sectionsData.forEach((sectionConfig) => {
        addSection(sectionConfig);
    });

    // Add Section Button
    document.getElementById('add-status-btn').addEventListener('click', addSection);

    // Save button
    document.getElementById('submit').addEventListener('click', () => {
        // Collect all the section data
        const sectionsData = [];

        const sections = container.querySelectorAll('.status-section');
        sections.forEach((sec) => {
            const status = sec.querySelector('.status-dropdown').value;
            const emailTitle = sec.querySelector('.email-title').value;
            const emailBody = sec.querySelector('.email-body').value;
            const multiFields = sec.querySelector('.multi-display').value;

            // Collect data from each section
            console.log(status);
            console.log(emailTitle);

            if(status != '' || emailTitle != '' || emailBody != '' || multiFields != ''){
                sectionsData.push({
                    status,
                    emailTitle,
                    emailBody,
                    multiFields,
                });

            }
            
        });

        // Prepare the configuration object - convert complex data to JSON string
        const configData = {
            sectionsDataJSON: JSON.stringify(sectionsData),  // Store as JSON string
            searchPluginStatus: escapeHtml(apiFormData.value) // Search plugin status value
        };

        console.log(configData);
        // Save to plugin configuration
        kintone.plugin.app.setConfig(configData, () => {
            window.location.href = `/k/admin/app/flow?app=${appId}`;
        });
    });

    // Cancel button
    document.getElementById('cancel').addEventListener('click', () => {
        window.location.href = `/k/admin/app/${appId}/plugin/`;
    });

})(kintone.$PLUGIN_ID);
