'use strict';
// Stable event IDs belong to each application, never to a shared settings store.
const max = [
 ['ambience','Фоновая музыка','Во время активной игры, зациклено','game_ambience_loop',.22,true],
 ['hold','Удержание иконки','Пока посетитель удерживает иконку','game_icon_hold_loop',.25,true],
 ['click1','Нажатие · вариант 1','Один из трёх вариантов нажатия кнопки','game_button_click_1',.45],
 ['click2','Нажатие · вариант 2','Один из трёх вариантов нажатия кнопки','game_button_click_2',.45],
 ['click3','Нажатие · вариант 3','Один из трёх вариантов нажатия кнопки','game_button_click_3',.45],
 ['grab1','Захват иконки · вариант 1','Начало перетаскивания иконки','game_icon_grab_1',.45],
 ['grab2','Захват иконки · вариант 2','Начало перетаскивания иконки','game_icon_grab_2',.45],
 ['phoneGrab','Захват телефона','Начало взаимодействия с телефоном','game_phone_grab_1',.45],
 ['pop','Появление иконки','Новый узел интерактивного маршрута','game_icon_pop',.35],
 ['hand','Экран с ладонью','Начало входа в интерактив','game_transition_handscreen',.5],
 ['row','Переход иконок','Построение ряда и упаковка при переходе','game_transition_icons',.4],
 ['link','Энергетическая линия','Построение соединяющей линии','game_enengy_stream_1',.4],
 ['fan','Раскрытие связей','Раскрытие связей с устройством','game_enengy_stream_2',.4],
 ['activate','Включение экрана','Первое включение экрана устройства','game_phonescreen_activate',.5],
 ['reactivate','Смена экрана','Следующий экран устройства','game_phonescreen_reactivate',.4],
 ['drop','Отпускание иконки','Отмена выбора с обратной связью','game_icons_deselect',.35],
].map(([id,label,description,file,volume,loop=false])=>({id,label,description,file:file+'.ogg',volume,loop}));
const stela = [
 ['AmbienceMain','Фоновая музыка','Основные экраны после входа, зациклено',true],
 ['Click','Нажатие кнопки','Доступные кнопки и элементы выбора'],
 ...['ChangeScreen','ChangeScreen2','ChangeScreen3','ChangeScreen4','ChangeScreen5'].map((id,i)=>[id,`Смена сцены · вариант ${i+1}`,'Варианты чередуются при смене сцены']),
 ['Tags','Вылет слов','Анимация выбранного направления'],
 ['ScanStart1','Начало отсчёта фото','Запуск обратного отсчёта'],
 ['Scan','Отсчёт и съёмка','Фоновый цикл во время съёмки',true],
 ['ScanEnd1','Принятие снимка','Подтверждение фотографии'],
].map(([id,label,description,loop=false])=>({id,label,description,file:id+'.wav',volume:loop?.18:.45,loop}));
module.exports={max,stela};
