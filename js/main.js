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

    let reset = true; // новый поиск или подгрузка новой страницы
    if (event.type == 'submit') {
        event.preventDefault(); 
    } 
    else { 
        reset = false; 
    }
    
    let form = document.getElementById('ghsearch-form');
    
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

    ghsearch(reset, query);
}

//-----------------------------
// Выполнить поиск асинхронно
async function ghsearch(reset, query) {

    let form = document.getElementById('ghsearch-form');
    let resultElem = document.getElementById('ghsearch-result');

    const perPage = 10;
    let page;

    if (reset) {
        page = 1;
        form.page.value = 1;
        resultElem.innerHTML = '';
    } 
    else {
        page = form.page.value ?? 1;
    }

    // добавляем иконку загрузки
    ghsearchShowInfo('', 'loading'); 

    // делаем fetch запрос
    let queryURL = `https://api.github.com/search/repositories?`
        + `q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;

    let response;
    try {
        response = await fetch(queryURL);
        //throw new Error('x');
    }
    catch (err) { // ловим ошибки fetch
        ghsearchShowInfo('Ошибка при выполнении запроса. Не удалось установить соединение с сервером', 'warn');
        console.log('fetch error: ' + err);
        return false;
    }

    // проверяем, что ответ 200
    if (response.status != 200) {
        ghsearchShowInfo('Ошибка при выполнении запроса. Ответ сервера ' + response.status, 'warn');
        console.log('http error: ' + response.status);
        return false;
    }
    
    // распаковываем json
    let result;
    try {
        result = await response.json();
    }
    catch (err) { // ловим ошибки распаковки json
        ghsearchShowInfo('Ошибка при выполнении запроса. Получены неправильные данные', 'warn');
        console.log('json error: ' + err);
        return false;
    }

    // удаляем иконку загрузки
    ghsearchClearInfo();

    // выводим результат
    //console.log('result: ' + JSON.stringify(result, null, 2));
    
    // список OL для результатов
    let listElem = document.getElementById('ghsearch-result-list');
    // если не существует, создаем
    if (!listElem) {
        listElem = document.createElement('OL');
        listElem.id = 'ghsearch-result-list';
        listElem.className = 'ghsearch__result-list';
        resultElem.prepend(listElem);
    }

    // добавляем элементы в список OL
    for (let item of result.items) {
        // получаем значение полей
        let full_name = escapeHTML(item.full_name ?? ''),
            html_url = item.html_url ?? '',
            description = escapeHTML(item.description ?? ''),
            avatar_url = item.owner?.avatar_url ?? '';

        // строим html содержимое LI
        let liHTML = `<div class="ghsearch__result-item-content">`    
        // правый блок с картинкой
        liHTML += `<div class="ghsearch__result-item-left">`;
        if ( avatar_url != '') {
            liHTML += `<a href="${html_url}" target="_blank">`
                + `<img src="${avatar_url}" alt="${full_name}" class="ghsearch__result-image"></a>`;
        }
        liHTML += `</div>`;
        // левый блок основной
        liHTML += `<div class="ghsearch__result-item-right">`
            + `<div class="ghsearch__result-title">`
            + `<a href="${html_url}" target="_blank">${full_name}</a></div>`
            + `<div class="ghsearch__result-descr">${description}</div>`
            + `</div>`;
        liHTML += `</div>`;
        
        //создаем элемент списка
        let itemElem = document.createElement('LI');
        itemElem.className = 'ghsearch__result-item';
        itemElem.innerHTML = liHTML;

        //добавляем элемент в список
        listElem.append(itemElem);
    }

    // кнопка Далее
    let moreElem = document.getElementById('ghsearch-result-more');
    // если не существует, создаем
    if (!moreElem) {
        moreElem = document.createElement('DIV');
        moreElem.id = 'ghsearch-result-more';
        moreElem.className = 'ghsearch__result-more';

        let moreBtnElem = document.createElement('BUTTON');
        moreBtnElem.className = 'ghsearch__result-more-button button';
        moreBtnElem.innerHTML = 'Загрузить еще';
        moreBtnElem.addEventListener('click', ghsearchFormSubmit);
        
        moreElem.append(moreBtnElem);
        resultElem.append(moreElem);
    }

    // инкремент номера страницы
    form.page.value++;

    // функция добавляет информационное сообщение (иконка загрузки или ошибка)
    function ghsearchShowInfo(msg, icon = '') {
        // удаляем старое информационное сообщение, если есть
        document.getElementById('ghsearch-info')?.remove();
        
        // создаем новое информационное сообщение
        let infoElem = document.createElement('DIV');
        infoElem.id = 'ghsearch-info';
        infoElem.className = 'ghsearch__info';

        // создаем html информационного блока
        let infoHTML = '';
        if (icon != '') {
            let iconClass = 'ghsearch__info-icon';
            if (icon == 'loading') {
                iconClass += ' ghsearch__info-icon--loading';
            }
            else {
                iconClass += ' ghsearch__info-icon--warn';
            }
            infoHTML += `<div class="${iconClass}"></div>`;
        }
        infoHTML += `<div class="ghsearch__info-msg">${escapeHTML(msg)}</div>`;

        infoElem.innerHTML = infoHTML;

        // добавляем
        resultElem.append(infoElem);
    }

    // функция удаляет информационные сообщения
    function ghsearchClearInfo() {
        document.getElementById('ghsearch-info')?.remove();
    }
}

//-----------------------------
// Ввод на форме
function ghsearchFormInput(event) {
    let elem = event.target;
    if (elem.tagName == 'INPUT') { 
        // убираем сообщение об ошибке
        elem.classList.remove('input-text--error');
        elem.form.querySelector(`[name="${elem.name}-errormsg"]`).innerHTML = '';
    }

    // удаляем кнопку Еще
    document.getElementById('ghsearch-result-more')?.remove();
}

//-----------------------------
// Экранирование символов для вывода в html 
function escapeHTML(str) {
    return (
        String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt')
    );
}

