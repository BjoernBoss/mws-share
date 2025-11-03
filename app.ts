/* SPDX-License-Identifier: BSD-3-Clause */
/* Copyright (c) 2024-2025 Bjoern Boss Henrichsen */
import * as libCommon from "core/common.js";
import * as libClient from "core/client.js";
import * as libLog from "core/log.js";
import * as libTemplates from "core/templates.js";
import * as libLocation from "core/location.js";
import * as libFs from "fs";

/*	Directory templates
*	page defines:
*		{path}: path of directory
*		{entries}: appended list of children
*	Entry defines:
*		{path}: path to entry
*		{name}: name of entry
*	Empty defines:
*		%none%
*/
export class Application implements libCommon.AppInterface {
	private templates: { entry: string, empty: string, page: string };
	private fileStorage: (path: string) => string;

	constructor(dataPath: string) {
		this.fileStorage = libLocation.MakeStoragePath(dataPath);
		const fileStatic = libLocation.MakeAppPath(import.meta.url, 'static');
		this.templates = {
			empty: libFs.readFileSync(fileStatic("empty.txt"), 'utf-8'),
			entry: libFs.readFileSync(fileStatic("entry.txt"), 'utf-8'),
			page: libFs.readFileSync(fileStatic("page.html"), 'utf-8')
		};
	}

	private listDirectory(client: libClient.HttpRequest, filePath: string): void {
		var content = libFs.readdirSync(filePath);

		/* cleanup the path to end in a slash */
		var dirPath = client.fullpath;
		if (!dirPath.endsWith('/'))
			dirPath = dirPath + '/';

		/* check if the parent directory should be added */
		if (client.path != '/')
			content = ['..'].concat(content);

		/* check if entries have been found */
		var entries = '';
		if (content.length > 0) {
			/* extract the entry-template to be used */
			const teEntry = this.templates.entry;

			/* expand all entries */
			for (var i = 0; i < content.length; ++i) {
				var childPath = dirPath + content[i];

				/* check if this is the parent-entry and make the path cleaner (skip the last slash) */
				if (content[i] == '..')
					childPath = dirPath.substring(0, dirPath.lastIndexOf('/', dirPath.length - 2));

				entries += libTemplates.Expand(teEntry, { path: childPath, name: content[i] });
			}
		}
		else
			entries = libTemplates.Expand(this.templates.empty, {});

		/* update the path to not contain the trailing slash */
		if (dirPath != '/')
			dirPath = dirPath.substring(0, dirPath.length - 1);

		/* construct the final template and return it */
		const out = libTemplates.Expand(this.templates.page, { path: client.path, entries });
		client.respondHtml(out);
	}
	public request(client: libClient.HttpRequest): void {
		libLog.Log(`Shared handler for [${client.path}]`);

		/* expand the path */
		const filePath = this.fileStorage(client.path);

		/* ensure the request is using the Get-method */
		if (client.ensureMethod(['GET']) == null)
			return;

		/* check if the path exists in the filesystem */
		if (libFs.existsSync(filePath)) {
			const what = libFs.lstatSync(filePath);

			/* check if the path is a file */
			if (what.isFile()) {
				client.tryRespondFile(filePath);
				return;
			}

			/* check if the path is a directory */
			else if (what.isDirectory()) {
				this.listDirectory(client, filePath);
				return;
			}
		}

		/* add the not found error */
		libLog.Log(`Request to unknown resource`);
		client.respondNotFound();
	}
	public upgrade(client: libClient.HttpUpgrade): void {
		libLog.Log(`Shared handler for [${client.path}]`);
		client.respondNotFound();
	}
};
