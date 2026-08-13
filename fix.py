import re

with open('client/src/app/(librarian)/reservations/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the outer div transparent so it inherits AppLayout bg
content = content.replace('className="relative h-[calc(100vh-12rem)] flex flex-col bg-gray-50 dark:bg-slate-900"', 'className="relative h-[calc(100vh-12rem)] flex flex-col"')

# Header
content = content.replace('px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950', 'px-6 py-5 border-b" style={{ borderColor: \'var(--color-signal-border-dark)\' }} className="flex')
# Fix the header class attribute syntax issue
content = content.replace('border-b" style={{ borderColor: \'var(--color-signal-border-dark)\' }} className="flex flex-col', 'border-b" style={{ borderColor: \'var(--color-signal-border-dark)\' }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0"')

# Table Container (wrap in Card)
# Currently: <div className="flex-1 overflow-auto relative bg-white dark:bg-slate-950">
content = content.replace('<div className="flex-1 overflow-auto relative bg-white dark:bg-slate-950">', '<Card surface="dark" className="flex-1 overflow-auto relative">')
content = content.replace('</div>\n\n          {/* PAGINATION */}', '</Card>\n\n          {/* PAGINATION */}')

# Table header
content = content.replace('<thead className="sticky top-0 bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800 z-10 uppercase text-xs font-bold tracking-wider">', '<thead className="sticky top-0 opacity-80 border-b z-10 uppercase text-xs font-mono font-bold tracking-wider" style={{ borderColor: \'var(--color-signal-border-dark)\', backgroundColor: \'var(--color-signal-bg-dark)\' }}>')

# Table body
content = content.replace('<tbody className="divide-y divide-gray-200 dark:divide-slate-800">', '<tbody>')

# Rows
content = content.replace('<tr \n                      key={res.id} \n                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${focusedReservation?.id === res.id ? \'bg-indigo-50/50 dark:bg-indigo-900/10\' : \'\'}`}', '<tr \n                      key={res.id} \n                      className="border-b hover:opacity-80 cursor-pointer transition-opacity" style={{ borderColor: \'var(--color-signal-border-dark)\', opacity: focusedReservation?.id === res.id ? 1 : 0.9 }}')

# Badges
content = content.replace('case \'pending\': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold rounded-full border border-yellow-200 dark:border-yellow-800">Pending</span>;', 'case \'pending\': return <span className="text-xs font-mono" style={{ color: \'var(--color-signal-pending)\' }}>PENDING</span>;')
content = content.replace('case \'approved\': return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-800">Approved</span>;', 'case \'approved\': return <span className="text-xs font-mono" style={{ color: \'var(--color-signal-available)\' }}>APPROVED</span>;')
content = content.replace('case \'ready_for_pickup\': return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-800">Ready for Pickup</span>;', 'case \'ready_for_pickup\': return <span className="text-xs font-mono" style={{ color: \'var(--color-signal-available)\' }}>READY FOR PICKUP</span>;')
content = content.replace('case \'cancelled\': return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">Cancelled</span>;', 'case \'cancelled\': return <span className="text-xs font-mono" style={{ color: \'var(--color-signal-overdue)\' }}>CANCELLED</span>;')
content = content.replace('case \'expired\': return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700">Expired</span>;', 'case \'expired\': return <span className="text-xs font-mono opacity-60">EXPIRED</span>;')
content = content.replace('default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700">{status}</span>;', 'default: return <span className="text-xs font-mono opacity-60">{status.toUpperCase()}</span>;')

# Text colors removal
content = re.sub(r'text-gray-\d{3}\s+dark:text-slate-\d{3}', '', content)
content = re.sub(r'bg-gray-\d{3}\s+dark:bg-slate-\d{3}', 'bg-transparent', content)
content = re.sub(r'bg-white\s+dark:bg-slate-\d{3}', 'bg-transparent', content)
content = re.sub(r'border-gray-\d{3}\s+dark:border-slate-\d{3}', 'border-opacity-20', content)

with open('client/src/app/(librarian)/reservations/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
