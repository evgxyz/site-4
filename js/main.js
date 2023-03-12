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
    document.getElementById('ghsearch-form')
        .addEventListener('submit', ghsearchFormSubmit);
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
    if (query.length < 3) {
        valid = false;
        errorMsg = 'Запрос слишком короткий';
    }

    if (!valid) {
        form.query.classList.add('input-text--error');
        form.querySelector('[name="query-errormsg"]').innerHTML = errorMsg;
        return;
    }

    ghsearch(query);

    document.getElementById('ghsearch-result').innerHTML = 'Подождите...';
}

//-----------------------------
// Выполнить поиск асинхронно
async function ghsearch(query) {
    let queryURL = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    
    // делаем fetch запрос
    let response;
    try {
        response = await fetch(queryURL);
    }
    catch (err) { // ловим ошибки fetch
        console.log('fetch error: ' + err);
        return false;
    }

    // проверяем, что ответ 200
    if (response.status != 200) {
        console.log('http error: ' + response.status);
        return false;
    }
    
    // распаковываем json
    let result;
    try {
        result = await response.json();
    }
    catch (err) { // ловим ошибки распаковки json
        console.log('json error: ' + err);
        return false;
    }

    console.log('result: ' + JSON.stringify(result, null, 2));

    let html = '<ol class="ghsearch__result-list">';
    for (let item of result.items) {
        let {
            name,
            html_url: rep_html_url,
            description,
            owner: { 
                login, 
                html_url: user_html_url, 
                avatar_url 
            },
        } = item;

        html += `<li class="ghsearch__result-item">`;
        
        html += `<div class="ghsearch__result-item-left">`;
        if (avatar_url && avatar_url != '')
            html += `<img src="${avatar_url}" alt="${login}">`;
        html += `<a href="${user_html_url}">${login}</a>`;
        html += `</div>`;

        html += `<div class="ghsearch__result-item-right">`;
        html += `<div><a href="${rep_html_url}">${name}</a></div>`;
        html += `<div>${description}</div>`;
        html += `</div>`;

        html += `</li>`;
    }
    html += `</ol>`;

    document.getElementById('ghsearch-result').innerHTML = html;
}
