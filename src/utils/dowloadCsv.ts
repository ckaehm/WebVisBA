// basic idea see https://www.geeksforgeeks.org/how-to-create-and-download-csv-file-in-javascript/, visited 18.4.23

export function CsvDowload(csvData: string, fileName: string): void {
    // csv file with csvData
    const blob = new Blob([csvData], { type: 'text/csv' });

    // create an url representing the csv
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);

    // Set the link element's download attribute and text content
    a.setAttribute('download', `${fileName}.csv`);
    // download file
    a.click()
    // releases object URL
    URL.revokeObjectURL(url);
}