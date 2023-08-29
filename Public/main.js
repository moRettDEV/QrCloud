document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#uploadForm');
    const qrCodesDiv = document.getElementById('qrCodes');
    const fileList = document.getElementById('fileList');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton'); // Получаем ссылку на кнопку "Delete Selected"

    deleteSelectedButton.addEventListener('click', async () => {
        const checkboxes = document.querySelectorAll('input[name="selectedFiles"]:checked');
        const selectedFiles = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedFiles.length === 0) {
            alert('No files selected.');
            return;
        }

        const response = await fetch('/delete-selected', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedFiles) // Send an array of selected filenames
        });

        const result = await response.json();
        if (result.success) {
            fetchFiles(); // Update the file list after successful deletion
        } else {
            alert('Failed to delete selected files.');
        }
    });

    async function generateQR(qrDataURL) {
        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = qrDataURL;
        qrCodeImg.alt = 'QR Code';
        qrCodesDiv.appendChild(qrCodeImg);
    }

    async function generateQRForFile(filename) {
        const response = await fetch(`/generate-qr/${filename}`);
        const data = await response.json();
        generateQR(data.qrDataURL);
    }

    async function deleteFile(filename) {
        const response = await fetch(`/delete/${filename}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            fetchFiles();
        } else {
            alert('Failed to delete the file.');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const qrDataArray = await response.json();
        qrCodesDiv.innerHTML = ''; // Очищаем содержимое перед добавлением новых QR-кодов

        qrDataArray.forEach(data => {
            generateQR(data.qrData); // Генерируем QR-код для каждого файла
        });

        fetchFiles(); // Обновляем список файлов после загрузки новых файлов
    });

    async function fetchFiles() {
        const response = await fetch('/list');
        const data = await response.json();

        fileList.innerHTML = '';

        data.files.forEach((filename) => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            const fileNameDiv = document.createElement('div');
            fileNameDiv.classList.add('mr-auto'); // Выравнивание элемента по левому краю

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'selectedFiles';
            checkbox.value = filename;
            fileNameDiv.appendChild(checkbox);

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = filename;
            fileNameDiv.appendChild(fileNameSpan);

            listItem.appendChild(fileNameDiv);

            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('d-flex', 'align-items-center');

            const generateQRButton = document.createElement('button');
            generateQRButton.classList.add('btn', 'btn-primary', 'btn-sm', 'mr-2'); // Отступ между кнопками
            generateQRButton.textContent = 'Generate QR';
            generateQRButton.addEventListener('click', () => {
                generateQRForFile(filename);
            });
            buttonsDiv.appendChild(generateQRButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'mr-2'); // Отступ между кнопками
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteFile(filename);
            });
            buttonsDiv.appendChild(deleteButton);

            listItem.appendChild(buttonsDiv);

            fileList.appendChild(listItem);
        });
    }

    // Вызов функции для загрузки списка файлов при загрузке страницы
    fetchFiles();
});
