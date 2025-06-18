import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import FileExplorer from './components/FileExplorer';
// 导入新的库组件
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './App.css'; // 我们将为新库微调样式

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('// 从左侧选择一个文件，或在此处开始编写代码...');
  const [analysisResults, setAnalysisResults] = useState([]);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/files`)
      .then(response => setFiles(response.data))
      .catch(error => console.error("获取文件列表失败:", error));
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const newDecorations = analysisResults.map(result => ({
        range: new window.monaco.Range(result.line_start, 1, result.line_end, 100),
        options: {
          isWholeLine: true,
          className: `highlight-${result.risk_level.toLowerCase()}-risk`,
          hoverMessage: { value: `[${result.risk_level}] ${result.summary}` }
        }
      }));
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
    }
  }, [analysisResults]);

  const handleFileSelect = (filePath) => {
    if (editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
    axios.get(`${API_BASE_URL}/api/file-content?path=${filePath}`)
      .then(response => {
        setCode(response.data.content);
        setActiveFile(filePath);
        setAnalysisResults([]);
      })
      .catch(error => console.error("获取文件内容失败:", error));
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    window.monaco = monaco;
  };

  const handleAnalyze = async () => {
    if (!editorRef.current) return;
    const currentCode = editorRef.current.getValue();
    if (!currentCode) return alert("代码不能为空！");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, { code: currentCode });
      setAnalysisResults(response.data);
    } catch (error) {
      console.error("AI分析请求失败:", error);
      alert("AI分析失败，请检查后端服务和日志。");
    }
  };

  return (
    <div className="App">
      <div className="file-explorer">
        <FileExplorer files={files} onFileSelect={handleFileSelect} />
      </div>

      <div className="main-content">
        <button className="analyze-button" onClick={handleAnalyze}>执行AI分析</button>
        {/* 使用新的 PanelGroup 组件来实现布局 */}
        <PanelGroup direction="vertical">
          <Panel defaultSize={70} minSize={20}>
            <div className="editor-container">
              <Editor
                height="100%"
                language={activeFile?.split('.').pop() || 'javascript'}
                theme="vs-dark"
                value={code}
                onMount={handleEditorDidMount}
                onChange={(value) => setCode(value)}
              />
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={30} minSize={10}>
            <div className="analysis-panel">
              <h2>AI分析结果</h2>
              {analysisResults.length === 0 ? (
                <p style={{ color: '#888' }}>点击上方按钮开始分析...</p>
              ) : (
                analysisResults.map((result, index) => (
                  <div key={index} className="analysis-item">
                    <div className="analysis-item-header">
                      <span className={`risk-badge risk-${result.risk_level.toLowerCase()}`}>{result.risk_level}</span>
                      <strong>{result.summary}</strong>
                    </div>
                    <p><strong>行号:</strong> {result.line_start}-{result.line_end} | <strong>置信度:</strong> {result.confidence}%</p>
                    <p><strong>建议:</strong> {result.suggestion}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;