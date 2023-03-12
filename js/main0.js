'use strict'

//-----------------------------
// Начинаем работать с DOM, когда он готов
document.addEventListener('DOMContentLoaded', DOMReady);

function DOMReady() {
    console.log('DOM ready');
    initComments();
}

//-----------------------------
// Ставим обработчики событий, выводим сообщения из хранилища
function initComments() {
    let commentForm = document.getElementById('comment-form');
    // отпрака формы
    commentForm.addEventListener('submit', commentFormSubmit);
    commentForm.text.addEventListener('keydown', commentFormTextKeydown);
    // ввод на форме
    commentForm.addEventListener('input', commentFormInput);

    let commentsBox = document.getElementById('comments-box');
    commentsBox.addEventListener('click', commentsBoxClick);

    printComments();
}

//-----------------------------
// Отправка формы добавления сообщения по событию submit
function commentFormSubmit(event) {
    let form = event.currentTarget;
    submitCommentForm(form);
    event.preventDefault(); 
}

//-----------------------------
// Отправка формы добавления сообщения по событию keydown
function commentFormTextKeydown(event) {
    let form = event.currentTarget.form;
    if (event.code == 'Enter' && (event.ctrlKey || event.shiftKey)) {
        submitCommentForm(form);
        event.preventDefault(); 
    }
}

//-----------------------------
// Отправка формы добавления сообщения
function submitCommentForm(form) {
    let {valid, name, text, date} = validCommentForm(form);
    
    if (valid) {
        let now = (new Date()).getTime();
        let id = now + '-' + randomInt(1000000, 9999999); // уникальный id сообщения
        if (!date) date = now; 

        let comment = {
            id: id,
            name: name,
            text: text,
            date: date,
            liked: false,
        };

        addComment(comment);

        clearCommentForm(form);
    }
}

//-----------------------------
// Клик на сообщениях: лайк или удаление сообщения
function commentsBoxClick(event) {
    let elem = event.target;

    let item = elem.closest('.comment__menu .comment__menu-item');
    if (!item) return;

    if (item.classList.contains('comment__menu-item--del')) {
        let parentComment = item.closest('.comment');
        if (!parentComment) return;
        let commentId = parentComment.dataset.commentId;
        if (!commentId) return;

        if (confirm('Удалить сообщение?')) {
            delComment(commentId);
        }
    }
    else 
    if (item.classList.contains('comment__menu-item--like')) {
        let parentComment = item.closest('.comment');
        if (!parentComment) return;
        let commentId = parentComment.dataset.commentId;
        if (!commentId) return;

        likeComment(commentId);
    }
}

//-----------------------------
// Ввод на форме
function commentFormInput(event) {
    let elem = event.target;
    if (elem.tagName == 'INPUT') {
        elem.classList.remove('input-text--error');
        elem.form.querySelector(`[name="${elem.name}-msgerror"]`).innerHTML = '';
    }
    else
    if (elem.tagName == 'TEXTAREA') {
        elem.classList.remove('textarea--error');
        elem.form.querySelector(`[name="${elem.name}-msgerror"]`).innerHTML = '';

        if (elem.name == 'text') {
            countInputText(elem);
        }
    }
}

//-----------------------------
// Счетчик символов
function countInputText(elem) {
    let maxlength = elem.getAttribute('maxlength');
    if (maxlength) {
        let count = maxlength - elem.value.length; 
        let counterStr = `Осталось символов: ${count}`;
        elem.form.querySelector(`[name="${elem.name}-counter"]`).innerHTML = counterStr;
    }
}

//-----------------------------
// Валидация формы добавления комментария. Возвращает объект с набором данных
function validCommentForm(form) {
    let valid = true;

    let name = form.name.value.trim();
    {
        let errorStr = '';
        if (name == '') {
            valid = false;
            errorStr = 'Имя пустое';   
        }
        else 
        if (!/^[\w\p{sc=Cyrillic}][\w\p{sc=Cyrillic}\-\s\.]+$/ui.test(name)) {
            valid = false;
            errorStr = 'Неправильный формат имени'; 
        }

        if (errorStr != '') {
            form.name.classList.add('input-text--error');
            form.querySelector('[name="name-msgerror"]').innerHTML = errorStr;
        }
    }

    let text = form.text.value.trim();
    {
        let errorStr = '';
        if (text == '') {
            valid = false;
            errorStr = 'Текст пустой';
        }
        
        if (errorStr != '') {
            form.text.classList.add('textarea--error');
            form.querySelector('[name="text-msgerror"]').innerHTML = errorStr;
        }
    }

    let date = null;
    {
        let dateStr = form.date.value.trim();
        let errorStr = '';
        if (dateStr != '') {
            let error;
            ({error, date} = parseDate(dateStr));
            if (error != 0) {
                valid = false;
                switch (error) {
                    case 1: errorStr += 'Неправильный формат даты'; break;
                    case 2: errorStr += 'Неправильная дата'; break;
                } 
            }
        }

        if (errorStr != '') {
            form.date.classList.add('input-text--error');
            form.querySelector('[name="date-msgerror"]').innerHTML = errorStr;
        }
    }

    return { 
        'valid': valid, 
        'name': name,
        'text': text,
        'date': date,
    };
}

//-----------------------------
// Очистка формы отправки комментария после отправки
function clearCommentForm(form) {
    form.name.value = '';
    form.text.value = '';
    form.date.value = '';
}

//-----------------------------
// Вывод всех комментариев на страницу из хранилища
function printComments() {
    let comments = JSON.parse(localStorage.getItem('comments')) ?? [];

    let html = '';
    for (let comment of comments) {
        html += commentToHTML(comment);
    }

    document.getElementById('comments-box').innerHTML = html;
}

//-----------------------------
// Получение html комментария
function commentToHTML(comment) {
    let html = '';

    html += `<div class="comment" data-comment-id="${escapeHTML(comment.id)}">`;

    html += `<div class="comment__name">${escapeHTML(comment.name)}</div>`;

    html += `<div class="comment__text">${escapeHTML(comment.text)}</div>`;

    let humanDateStr = humanDateFormat(comment.date);
    html += `<div class="comment__date">${escapeHTML(humanDateStr)}</div>`;

    // меню с кнопками
    html += `<div class="comment__menu">`;
    html += `<div class="comment__menu-item comment__menu-item--del"></div>`;
    let likedClass = comment.liked ? ' comment__menu-item--like-liked' : '';
    html += `<div class="comment__menu-item comment__menu-item--like${likedClass}"></div>`;
    html += `</div>`;

    html += `</div>`;

    return html;
}

//-----------------------------
// Добавление комментария
function addComment(comment) {
    // add comment to storage
    let comments = JSON.parse(localStorage.getItem('comments')) ?? [];
    comments.unshift(comment);
    localStorage.setItem('comments', JSON.stringify(comments));

    // add comment to page
    let commentsBox = document.getElementById('comments-box');
    commentsBox.insertAdjacentHTML('afterbegin', commentToHTML(comment));
}

//-----------------------------
// Удаление комментария
function delComment(commentId) {
    // delete comment from storage
    let comments = JSON.parse(localStorage.getItem('comments')) ?? [];
    let index = comments.findIndex(x => (x.id == commentId));
    comments.splice(index, 1);
    localStorage.setItem('comments', JSON.stringify(comments));

    // delete comment from page
    let commentsBox = document.getElementById('comments-box');
    commentsBox.querySelector(`[data-comment-id="${commentId}"]`)?.remove();
}

//-----------------------------
// Лайк комментария
function likeComment(commentId) {
    // like comment to storage
    let comments = JSON.parse(localStorage.getItem('comments')) ?? [];
    let index = comments.findIndex(x => (x.id == commentId));
    comments[index].liked = !comments[index].liked;
    localStorage.setItem('comments', JSON.stringify(comments));

    // like comment to page
    let commentsBox = document.getElementById('comments-box');
    commentsBox.querySelector(`[data-comment-id="${commentId}"]`)
        ?.querySelector(`.comment__menu-item--like`)
        ?.classList.toggle('comment__menu-item--like-liked');
}

//-----------------------------
// Парсинг даты в формате ДД.ММ.ГГГГ или ГГГГ.ММ.ДД. 
// Возвращает unixtime, при неудаче null
function parseDate(str) {
    str = str.trim();
    
    let daym, month, year, hours, minutes;
    let matches;

    if (matches = str.match(/^(\d{1,2})[\.\-\s]+(\d{1,2})[\.\-\s]+(\d{4})(\s+(\d{1,2})\s*[\:\.]\s*(\d{1,2}))?$/)) {
        daym = +matches[1], 
        month = +matches[2], 
        year = +matches[3];

        hours = 0, minutes = 0;
        if (matches[4]) {
            hours = +matches[5];
            minutes = +matches[6];
        }
    }
    else
    if (matches = str.match(/^(\d{4})[\.\-\s]+(\d{1,2})[\.\-\s]+(\d{1,2})(\s+(\d{1,2})\s*[\:\.]\s*(\d{1,2}))?$/)) {
        daym = +matches[3], 
        month = +matches[2], 
        year = +matches[1];

        hours = 0, minutes = 0;
        if (matches[4]) {
            hours = +matches[5];
            minutes = +matches[6];
        }
    }
    else {
        return { 'error': 1, 'date': null }; // неправильный формат
    }

    let monthIndex = month - 1;
    let date = new Date(year, monthIndex, daym, hours, minutes);
    if (
        date.getFullYear() == year && 
        date.getMonth() == monthIndex && 
        date.getDate() == daym && 
        date.getHours() == hours && 
        date.getMinutes() == minutes 
    ) {
        return { 'error': 0, 'date': date.getTime() };
    }
    else {
        return { 'error': 2, 'date': null }; // дата не реальная
    }
}

//-----------------------------
// Форматирует дату
function humanDateFormat(unixTime) {
    let date = new Date(unixTime);
    let dateTime = date.getTime();

    let now = new Date();
    let todayTime = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime();

    let dateStr = '';
    if (dateTime >= todayTime) {
        dateStr += 'сегодня';
    }
    else
    if (dateTime >= todayTime - 24*60*60*1000) {
        dateStr += 'вчера';
    }
    else {
        dateStr += `${date.getDate()} ${LangFormat.monthNameOf(date.getMonth())} ${date.getFullYear()}`;
    }

    let hoursStr = date.getHours().toString().padStart(2, '0');
    let minutesStr = date.getMinutes().toString().padStart(2, '0');
    dateStr += `, ${hoursStr}:${minutesStr}`;
    
    return dateStr;
}

//-----------------------------
class LangFormat {
    static locale = {
        ru: {
            monthNameArr: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Окрябрь', 'Ноябрь', 'Декабрь'],
            monthNameOfArr: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'окрября', 'ноября', 'декабря'],
            monthNameShortArr: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            weekdayNameShortArr: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
        },

        en: {
            monthNameArr: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthNameShortArr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            weekdayNameShortArr: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        },
    };

    static monthName(month, lang) {
        lang = lang && (lang in LangFormat.locale) ? lang : 'ru';
        return LangFormat.locale[lang].monthNameArr[month - 1];
    };

    static monthNameOf(month, lang) {
        lang = lang && (lang in LangFormat.locale) ? lang : 'ru';
        return LangFormat.locale[lang].monthNameOfArr[month - 1];
    };

    static monthNameShort(month, lang) {
        lang = lang && (lang in LangFormat.locale) ? lang : 'ru';
        return LangFormat.locale[lang].monthNameShortArr[month - 1];
    };

    static weekdayNameShort(day, lang) {
        lang = lang && (lang in LangFormat.locale) ? lang : 'ru';
        let dayIndex = day > 0 ? day - 1 : 6;
        return LangFormat.locale[lang].weekdayNameShortArr[dayIndex];
    };
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

//-----------------------------
// Случайное число от min до max
function randomInt(min, max) {
    return Math.floor(min + Math.random()*(max - min + 1));
}

//-----------------------------