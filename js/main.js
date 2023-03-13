'use strict'

//-----------------------------
// Начинаем работать с DOM, когда он готов
document.addEventListener('DOMContentLoaded', DOMReady);

function DOMReady() {
    console.log('DOM ready');
    initGhsearch();
}

//-----------------------------
// Ставим обработчики событий
function initGhsearch() {
    let ghsearchForm = document.getElementById('ghsearch-form');
    ghsearchForm.addEventListener('submit', ghsearchFormSubmit);
    ghsearchForm.addEventListener('input', ghsearchFormInput);
}

//-----------------------------
// Отправка формы по событию submit
function ghsearchFormSubmit(event) {
    event.preventDefault(); 
    
    let form = event.currentTarget;
    
    let valid = true;
    let errorMsg = '';

    let query = form.query.value.trim();
    if (query == '') {
        valid = false;
        errorMsg = 'Запрос пустой';
    } 
    else
    if (query.length < 2) {
        valid = false;
        errorMsg = 'Запрос слишком короткий';
    }

    if (!valid) {
        form.query.classList.add('input-text--error');
        form.querySelector('[name="query-errormsg"]').innerHTML = errorMsg;
        return;
    }

    ghsearch(query);

    ghsearchShowInfo('', 'ghsearch__info--wait'); // показываем иконку загрузки
}

//-----------------------------
// Выполнить поиск асинхронно
async function ghsearch(query) {
    let queryURL = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&page=1`;
    
    // делаем fetch запрос
    let response;
    try {
        response = await fetch(queryURL);
    }
    catch (err) { // ловим ошибки fetch
        ghsearchShowInfo('Ошибка при выполнении запроса. Не удалось установить соединение с сервером');
        console.log('fetch error: ' + err);
        return false;
    }

    // проверяем, что ответ 200
    if (response.status != 200) {
        ghsearchShowInfo('Ошибка при выполнении запроса. Ответ сервера ' + response.status);
        console.log('http error: ' + response.status);
        return false;
    }
    
    // распаковываем json
    let result;
    try {
        result = await response.json();
    }
    catch (err) { // ловим ошибки распаковки json
        ghsearchShowInfo('Ошибка при выполнении запроса. Получены неправильные данные');
        console.log('json error: ' + err);
        return false;
    }

    console.log('result: ' + JSON.stringify(result, null, 2));

    // оформляем результаты
    let html = '<ol class="ghsearch__result-list">';
    for (let item of result.items) {
        /* let {
            full_name,
            html_url,
            description,
            owner: { avatar_url },
        } = item; */

        let full_name = item.full_name ?? '',
            html_url = item.html_url ?? '',
            description = item.description ?? '',
            avatar_url = item.owner?.avatar_url ?? '';

        html += `<li class="ghsearch__result-item">`;
        html += `<div class="ghsearch__result-item-content">`;
        
        html += `<div class="ghsearch__result-item-left">`;
        if (avatar_url && avatar_url != '') {
            html += `<a href="${html_url}" target="_blank">`
                + `<img src="${avatar_url}" alt="${full_name}" class="ghsearch__result-image"></a>`;
        }
        html += `</div>`;

        html += `<div class="ghsearch__result-item-right">`;
        html += `<div class="ghsearch__result-title">`
            + `<a href="${html_url}" target="_blank">${full_name}</a></div>`;
        html += `<div class="ghsearch__result-descr">${description}</div>`;
        html += `</div>`;

        html += `</div>`; //item-content
        html += `</li>`;
    }
    html += `</ol>`;

    document.getElementById('ghsearch-result').innerHTML = html;
}

//-----------------------------
// Ввод на форме
function ghsearchFormInput(event) {
    let elem = event.target;
    if (elem.tagName == 'INPUT') { // убираем сообщение об ошибке
        elem.classList.remove('input-text--error');
        elem.form.querySelector(`[name="${elem.name}-errormsg"]`).innerHTML = '';
    }
}

//-----------------------------
// функции для показа информации 
function ghsearchShowInfo(msg, addClassName = '') {
    let infoElem = document.createElement('div');
    infoElem.textContent = msg;
    infoElem.className = 'ghsearch__info';
    if (addClassName != '') {
        infoElem.classList.add(addClassName);
    }

    let resultElem = document.getElementById('ghsearch-result');
    resultElem.innerHTML = ''; // resultElem.childNodes.forEach(e => e.remove());
    resultElem.append(infoElem);
}
