//
// Copyright © 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * @public
 */
export interface FileOp {
  key: string
  type: 'Upload' | 'Download' | 'Remove'
}

/**
 * @public
 */
export interface UploadFile extends FileOp {
  fileType: string
  type: 'Upload'
}

/**
 * @public
 */
export interface DownloadFile extends FileOp {
  fileName: string
  type: 'Download'
}

/**
 * @public
 */
export interface RemoveFile extends FileOp {
  type: 'Remove'
}

/**
 * @public
 */
export interface FileStorage {
  file: (op: FileOp) => Promise<string>
}
