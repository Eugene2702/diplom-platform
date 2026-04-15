import { format, formatDistanceToNow, isPast, isToday, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ru });
};

export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
};

export const isOverdue = (deadline) => {
  if (!deadline) return false;
  return isPast(new Date(deadline)) && !isToday(new Date(deadline));
};

export const isDueSoon = (deadline, days = 3) => {
  if (!deadline) return false;
  const d = new Date(deadline);
  return !isPast(d) && d <= addDays(new Date(), days);
};

export const statusLabels = {
  not_started: 'Не начат',
  in_progress: 'В процессе',
  completed: 'Выполнен',
  overdue: 'Просрочен',
  active: 'Активен',
  archived: 'В архиве',
};

export const roleLabels = {
  admin: 'Администратор',
  supervisor: 'Руководитель',
  student: 'Студент',
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

export const getFullName = (user) => {
  if (!user) return '—';
  return `${user.lastName || ''} ${user.firstName || ''} ${user.patronymic || ''}`.trim();
};
