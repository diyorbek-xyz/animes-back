const formater = new Intl.DateTimeFormat('en-US', {
	hour: '2-digit',
	minute: '2-digit',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

export default function formatDate(date: Date) {
	return formater.format(date);
}
