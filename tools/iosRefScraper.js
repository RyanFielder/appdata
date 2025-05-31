const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const { Device } = require('./device');

function extractDevicesFromHtmlTable($, tbody, sectionId) {
	const trs = tbody.find('tr');
	const rowCount = trs.length;
	console.log(`Section: ${sectionId}, Number of <tr> rows in <tbody>:`, rowCount);
	const colCount = 4;
	let colRowspan = Array(colCount).fill(0);
	let colValue = Array(colCount).fill("");
	const uniqueDevices = [];

	trs.each((rowIdx, tr) => {
		let tds = $(tr).children('td,th');
		let col = 0;
		let rowData = [];
		tds.each((_, td) => {
			$(td).html($(td).html().replace(/<sup>.*?<\/sup>/gi, ''));
		});
		for (let i = 0; i < colCount; i++) {
			if (colRowspan[i] > 0) {
				rowData[i] = colValue[i];
				colRowspan[i]--;
			} else {
				const td = tds.eq(col);
				if (td.length) {
					const text = td.text().trim();
					const rowspan = parseInt(td.attr('rowspan') || '1', 10);
					rowData[i] = text;
					colValue[i] = text;
					colRowspan[i] = rowspan - 1;
					col++;
				} else {
					rowData[i] = "";
					colValue[i] = "";
					colRowspan[i] = 0;
				}
			}
		}
		console.log(`Section: ${sectionId}, Row ${rowIdx + 1}:`, rowData);
		rowData[0] = rowData[0].replace(/<sup>.*?<\/sup>/gi, '').trim();
		let name = rowData[0] || 'Unknown Device';
		let status = 'none';
		if (name.toLowerCase().includes('obsolete')) {
			status = 'obsolete';
			name = name.replace(/obsolete/i, '').trim();
		}
		if (name.toLowerCase().includes('vintage')) {
			status = 'vintage';
			name = name.replace(/vintage/i, '').trim();
		}
		if (name.toLowerCase().includes('none')) {
			status = 'none';
			name = name.replace(/none/i, '').trim();
		}
		if (sectionId === 'watch' && !name.toLowerCase().includes('apple watch')) {
			name = `Apple Watch ${name}`;
		}
		if (name.includes('/')) {
			const baseName = name.split('/')[0].trim();
			const baseNameParts = baseName.split(' ');
			const names = name.split('/').map((n, index) => {
				if (index === 0) {
					return n.trim();
				}
				const splitParts = n.trim().split(' ');
				const uniqueParts = splitParts.filter(part => !baseNameParts.includes(part));
				return `${baseName} ${uniqueParts.join(' ')}`.trim();
			});
			names.forEach(n => {
				const device = new Device(
					status,
					parseInt(rowData[2], 10) || 0,
					parseInt(rowData[3], 10) || 0,
					sectionId,
					n || 'Unknown Device',
					rowData[1] ? rowData[1].split(' ')[0] : 'Unknown Release Date'
				);
				if (!uniqueDevices.some(existingDevice => existingDevice.isEqual(device))) {
					uniqueDevices.push(device);
					console.log(`Section: ${sectionId}, New Unique Device:`, device);
				} else {
					console.log(`Section: ${sectionId}, Duplicate Device Skipped:`, device);
				}
			});
			return;
		}
		const device = new Device(
			status,
			parseInt(rowData[2], 10) || 0,
			parseInt(rowData[3], 10) || 0,
			sectionId,
			name || 'Unknown Device',
			rowData[1] ? rowData[1].split(' ')[0] : 'Unknown Release Date'
		);
		if (!uniqueDevices.some(existingDevice => existingDevice.isEqual(device))) {
			uniqueDevices.push(device);
			console.log(`Section: ${sectionId}, New Unique Device:`, device);
		} else {
			console.log(`Section: ${sectionId}, Duplicate Device Skipped:`, device);
		}
	});
	return uniqueDevices;
}

function main() {
	// load original device list
	const originalDeviceListPath = 'devutils/devicelist.json';
	if (!fs.existsSync(originalDeviceListPath)) {
		console.error('Original device list not found:', originalDeviceListPath);
		return;
	}
	const originalDeviceList = JSON.parse(fs.readFileSync(originalDeviceListPath, 'utf8'));

	const allDevices = [];
	const cheerio = require('cheerio');
	const urls = [
		'https://iosref.com/ios',
		'https://iosref.com/watchos',
		'https://iosref.com/tvos'
	];
	Promise.all(urls.map(url => {
		return axios.get(url)
			.then(response => {
				const html = response.data;
				const $ = cheerio.load(html);
				$('h2, h3').each((_, header) => {
					const sectionId = $(header).attr('id') || $(header).text().trim();
					let mappedSectionId = '';
					if (sectionId.toLowerCase().includes('iphone')) {
						mappedSectionId = 'phone';
					} else if (sectionId.toLowerCase().includes('ipad')) {
						mappedSectionId = 'pad';
					} else if (sectionId.toLowerCase().includes('ipod')) {
						mappedSectionId = 'pod';
					} else if (sectionId.toLowerCase().includes('watch')) {
						mappedSectionId = 'watch';
					} else if (sectionId.toLowerCase().includes('tv')) {
						mappedSectionId = 'tv';
					} else {
						return;
					}
					let tableContainer = $(header).nextAll('div.table-responsive').first();
					let table = tableContainer.length > 0 ? tableContainer.find('table') : $(header).nextAll('table').first();
					if (table.length === 0) {
						console.warn(`No table found for section: ${sectionId}`);
						return;
					}
					const tbody = table.find('tbody');
					if (tbody.length === 0) {
						console.warn(`No tbody found in table for section: ${sectionId}`);
						return;
					}
					console.log(`Processing section: ${sectionId}, Mapped ID: ${mappedSectionId}`);
					console.log(`Table found: ${table.length > 0}, Tbody found: ${tbody.length > 0}`);
					if (tbody.length > 0) {
						const devices = extractDevicesFromHtmlTable($, tbody, mappedSectionId);
						allDevices.push(...devices);
					}
				});
			})
			.catch(error => {
				console.error(`Error fetching the HTML from ${url}:`, error);
			});
	})).then(() => {
		const uniqueDevices = [];
		allDevices.forEach(device => {
			if (!uniqueDevices.some(existingDevice => existingDevice.isEqual(device))) {
				uniqueDevices.push(device);
			} else {
				console.log(`Duplicate Device Found:`, device);
			}
		});
		console.log(`Total unique devices extracted: ${uniqueDevices.length}`);
		console.log(`Removed ${allDevices.length - uniqueDevices.length} duplicates`);
		if (allDevices.length - uniqueDevices.length > 0) {
			console.log('Removed Duplicates:');
			allDevices.forEach(device => {
				if (!uniqueDevices.some(existingDevice => existingDevice.isEqual(device))) {
					console.log(device);
				}
			});
		} else {
			console.log('No duplicates found.');
		}
		uniqueDevices.sort((a, b) => {
			const order = ['phone', 'pad', 'watch', 'tv', 'pod'];
			return order.indexOf(a.type) - order.indexOf(b.type);
		});
		if (uniqueDevices.length < originalDeviceList.length) {
			console.warn('New device list has fewer entries than the original. Not overwriting devicelist.json');
			return;
		}
		fs.writeFile('devutils/devicelist.json', JSON.stringify(uniqueDevices, null, 2), (err) => {
			if (err) {
				console.error('Error writing to file:', err);
			} else {
				console.log('Devices successfully written to devicelist.json');
			}
		});
	});
}

main();
