// src/components/FileExplorer.js
import React from 'react';
// 引入我们安装的图标库
import { FiFileText, FiFolder } from 'react-icons/fi';
import './FileExplorer.css'; // 我们将为它创建一些样式

const FileExplorer = ({ files, onFileSelect }) => {
    return (
        <div className="file-explorer-container">
            <h2>文件浏览器</h2>
            <ul className="file-list">
                {files.map(file => (
                    <li key={file.path} className="file-item" onClick={() => onFileSelect(file.path)}>
                        {file.isDirectory ? <FiFolder className="icon" /> : <FiFileText className="icon" />}
                        <span className="file-name">{file.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileExplorer;