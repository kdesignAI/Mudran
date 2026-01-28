
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("কোন তথ্য পাওয়া যায়নি এক্সপোর্ট করার জন্য।");
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        // Handle nested objects or dates if necessary
        if (typeof value === 'object' && value !== null) {
          // Simplistic handling for nested objects like 'customer'
          if (fieldName === 'customer') return `"${value.name}"`; 
          return JSON.stringify(value).replace(/"/g, '""'); 
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\r\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
