document.addEventListener('DOMContentLoaded', function () {

    // Находим все нужные элементы
    const studentRadio = document.getElementById('roleStudent');
    const teacherRadio = document.getElementById('roleTeacher');
    const groupContainer = document.getElementById('group-container');
    const groupInput = groupContainer.querySelector('input[name="Group"]');

    // Функция, которая решает - показать или скрыть поле "Група"
    function toggleGroupField() {
        if (studentRadio.checked) {
            // Если "Студент" - показываем
            groupContainer.style.display = 'block';
        } else {
            // Если "Викладач" - скрываем, очищаем значение и убираем ошибки
            groupContainer.style.display = 'none';
            groupInput.value = ''; // Очищаем значение

            // Это важно для unobtrusive-validation:
            // Вручную убираем ошибки валидации из-под поля, если оно скрыто
            const validationSpan = groupContainer.querySelector('span[data-valmsg-for="Group"]');
            if (validationSpan) {
                validationSpan.textContent = '';
            }
            groupInput.classList.remove('input-validation-error');
        }
    }

    // 1. Вызываем функцию при загрузке страницы (на случай, если "Викладач" выбран по умолчанию)
    toggleGroupField();

    // 2. Добавляем слушатели на изменение радио-кнопок
    studentRadio.addEventListener('change', toggleGroupField);
    teacherRadio.addEventListener('change', toggleGroupField);
});