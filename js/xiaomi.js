// 小米动态照片处理模块
async function synthesizeXiaomi(staticImage, videoFile) {
    try {
        window.showResult('正在读取文件...');
        const imageData = await FileUtils.readAsArrayBuffer(staticImage);
        const videoData = await FileUtils.readAsArrayBuffer(videoFile);

        // 获取视频大小
        const videoSize = videoData.byteLength;
        console.log('视频大小:', videoSize);

        window.showResult('正在合成文件...');
        
        // 查找并处理 JPEG 段
        const imageView = new DataView(imageData);
        let pos = 0;
        let segments = [];
        let hasXMP = false;

        // 检查 JPEG SOI 标记 (0xFFD8)
        if (imageView.getUint16(pos) !== 0xFFD8) {
            throw new Error('无效的JPEG文件格式');
        }
        segments.push({ offset: 0, length: 2 }); // SOI 标记
        pos += 2;

        // 遍历所有 JPEG 段
        while (pos < imageData.byteLength - 1) {
            const marker = imageView.getUint16(pos);
            if ((marker & 0xFF00) !== 0xFF00) {
                throw new Error('无效的JPEG标记');
            }

            if (marker === 0xFFDA) { // SOS 标记，图像数据开始
                segments.push({ offset: pos, length: imageData.byteLength - pos });
                break;
            }

            const length = imageView.getUint16(pos + 2);
            if (marker === 0xFFE1) { // APP1 段
                const identifier = String.fromCharCode(
                    imageView.getUint8(pos + 4),
                    imageView.getUint8(pos + 5),
                    imageView.getUint8(pos + 6),
                    imageView.getUint8(pos + 7)
                );
                
                if (identifier === 'Exif' || identifier === 'http') {
                    console.log('跳过现有的 EXIF/XMP 数据');
                    pos += length + 2;
                    continue;
                }
            }

            segments.push({ offset: pos, length: length + 2 });
            pos += length + 2;
        }

        // 构建 EXIF 数据
        const exifHeader = new Uint8Array([
            // SOI 标记
            0xFF, 0xD8,

            // EXIF 段 (APP1)
            0xFF, 0xE1,
            0x00, 0x88, // 长度 (136 字节)
            0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // Exif 头
            0x4D, 0x4D, // 大端字节序 (MM)
            0x00, 0x2A, // TIFF 标识
            0x00, 0x00, 0x00, 0x08, // IFD0 偏移
            
            // IFD0
            0x00, 0x04, // IFD0 条目数量 (4个条目)
            
            // 第一个条目 (0x0100 - ImageWidth)
            0x01, 0x00, // 标签
            0x00, 0x04, // 类型 (LONG)
            0x00, 0x00, 0x00, 0x01, // 计数
            0x00, 0x00, 0x04, 0x38, // 值 (1080)
            
            // 第二个条目 (0x0101 - ImageLength)
            0x01, 0x01, // 标签
            0x00, 0x04, // 类型 (LONG)
            0x00, 0x00, 0x00, 0x01, // 计数
            0x00, 0x00, 0x09, 0x60, // 值 (2400)
            
            // 第三个条目 (0x0112 - Orientation)
            0x01, 0x12, // 标签
            0x00, 0x03, // 类型 (SHORT)
            0x00, 0x00, 0x00, 0x01, // 计数
            0x00, 0x01, 0x00, 0x00, // 值 (1)
            
            // 第四个条目 (0x8769 - ExifOffset)
            0x87, 0x69, // 标签
            0x00, 0x04, // 类型 (LONG)
            0x00, 0x00, 0x00, 0x01, // 计数
            0x00, 0x00, 0x00, 0x6E, // 值 (110) - 指向 Exif IFD
            
            0x00, 0x00, 0x00, 0x00, // 下一个 IFD 的偏移量 (0 表示没有下一个 IFD)
            
            // Exif IFD
            0x00, 0x05, // Exif IFD 条目数量 (5个条目)
            
            // 第一个条目 (0x8897 - MicroVideo)
            0x88, 0x97, // 标签
            0x00, 0x01, // 类型 (BYTE)
            0x00, 0x00, 0x00, 0x01, // 计数
            0x01, 0x00, 0x00, 0x00, // 值 (1)
            
            // 第二个条目 (0x9000 - ExifVersion)
            0x90, 0x00, // 标签
            0x00, 0x07, // 类型 (UNDEFINED)
            0x00, 0x00, 0x00, 0x04, // 计数
            0x30, 0x32, 0x33, 0x32, // 值 ("0232")
            
            // 第三个条目 (0x9101 - ComponentsConfiguration)
            0x91, 0x01, // 标签
            0x00, 0x07, // 类型 (UNDEFINED)
            0x00, 0x00, 0x00, 0x04, // 计数
            0x01, 0x02, 0x03, 0x00, // 值
            
            // 第四个条目 (0xA000 - FlashpixVersion)
            0xA0, 0x00, // 标签
            0x00, 0x07, // 类型 (UNDEFINED)
            0x00, 0x00, 0x00, 0x04, // 计数
            0x30, 0x31, 0x30, 0x30, // 值 ("0100")
            
            // 第五个条目 (0xA001 - ColorSpace)
            0xA0, 0x01, // 标签
            0x00, 0x03, // 类型 (SHORT)
            0x00, 0x00, 0x00, 0x01, // 计数
            0xFF, 0xFF, 0x00, 0x00, // 值 (65535)
            
            0x00, 0x00, 0x00, 0x00, // Exif IFD 结束标记
            
            // JFIF 段 (APP0)
            0xFF, 0xE0, 0x00, 0x10,
            0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
            0x01, 0x01, // 版本 1.1
            0x00, // 密度单位
            0x00, 0x01, 0x00, 0x01, // 密度
            0x00, 0x00 // 缩略图
        ]);

        // 计算并设置 EXIF 段长度
        const exifLength = exifHeader.length - 22; // 减去 SOI + APP0 + APP1 标记和长度字段
        exifHeader[20] = (exifLength >> 8) & 0xFF;
        exifHeader[21] = exifLength & 0xFF;

        // 构建 XMP 数据
        const xmpTemplate = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description rdf:about=""
            xmlns:GCamera="http://ns.google.com/photos/1.0/camera/">
            <GCamera:MicroVideo>1</GCamera:MicroVideo>
            <GCamera:MicroVideoVersion>1</GCamera:MicroVideoVersion>
            <GCamera:MicroVideoOffset>${videoSize}</GCamera:MicroVideoOffset>
            <GCamera:MicroVideoPresentationTimestampUs>0</GCamera:MicroVideoPresentationTimestampUs>
        </rdf:Description>
    </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

        const xmpData = new TextEncoder().encode(xmpTemplate);
        const xmpLength = xmpData.length + 2 + 29; // 2字节长度 + 29字节头部

        // 构建 XMP APP1 段
        const xmpMarker = new Uint8Array([
            0xFF, 0xE1,
            (xmpLength >> 8) & 0xFF, xmpLength & 0xFF,
            0x68, 0x74, 0x74, 0x70, 0x3A, 0x2F, 0x2F, 0x6E, 0x73, 0x2E, 0x61, 0x64, 
            0x6F, 0x62, 0x65, 0x2E, 0x63, 0x6F, 0x6D, 0x2F, 0x78, 0x61, 0x70, 0x2F, 
            0x31, 0x2E, 0x30, 0x2F
        ]);

        // 计算最终文件大小
        let finalSize = 2; // SOI
        finalSize += exifHeader.length; // EXIF 段
        finalSize += xmpMarker.length + xmpData.length; // XMP 段
        for (const segment of segments) {
            finalSize += segment.length;
        }
        finalSize += videoData.byteLength; // 视频数据

        // 创建最终数据
        const finalData = new Uint8Array(finalSize);
        let writePos = 0;

        // 写入头部（包含 SOI、JFIF 和 EXIF）
        finalData.set(exifHeader, writePos);
        writePos += exifHeader.length;

        // 写入 XMP 段
        finalData.set(xmpMarker, writePos);
        writePos += xmpMarker.length;
        finalData.set(xmpData, writePos);
        writePos += xmpData.length;

        // 写入其他段（跳过原始文件的 SOI、JFIF 和 EXIF）
        for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            if (segment.offset > 20) { // 跳过原始文件的头部段
                finalData.set(new Uint8Array(imageData, segment.offset, segment.length), writePos);
                writePos += segment.length;
            }
        }

        // 写入视频数据
        finalData.set(new Uint8Array(videoData), writePos);

        // 下载合成的文件
        const filename = `${staticImage.name.split('.')[0]}_live.jpg`;
        FileUtils.downloadFile(finalData, filename);

        window.showResult('合成完成！文件已下载。\n注意：请在手机上查看是否正确显示为动态照片。');
    } catch (error) {
        console.error('合成失败:', error);
        throw new Error('合成失败: ' + error.message);
    }
}

// 添加全局变量来存储分离后的数据
window.separatedFiles = {
    imageData: null,
    videoData: null
};

async function separateXiaomi(livePhoto) {
    try {
        console.log('开始处理小米动态照片...');
        window.showResult('正在读取文件...');
        const data = await FileUtils.readAsArrayBuffer(livePhoto);
        console.log('文件读取完成，大小:', data.byteLength);
        
        // 读取MicroVideoOffset
        console.log('正在读取EXIF数据...');
        let offset = 0;
        
        try {
            const view = new DataView(data);
            
            // 首先尝试从后向前查找视频文件头
            console.log('尝试从后向前查找视频文件头...');
            for (let i = data.byteLength - 8; i >= 0; i--) {
                try {
                    // 查找 MP4 文件头 (ftyp)
                    if (view.getUint32(i) === 0x66747970) {
                        // 验证前4个字节是否为有效的box大小
                        const possibleSize = view.getUint32(i - 4);
                        if (possibleSize > 0 && possibleSize < 100) { // 合理的ftyp box大小范围
                            offset = i - 4;
                            console.log('找到视频文件头，偏移值:', offset);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            // 如果没找到，尝试在 XMP 中查找
            if (offset === 0) {
                console.log('尝试在 XMP 中查找...');
                const content = new TextDecoder().decode(data);
                const match = content.match(/MicroVideoOffset>(\d+)</);
                if (match) {
                    offset = parseInt(match[1], 10);
                    console.log('在 XMP 中找到偏移值:', offset);
                }
            }

            // 如果还是没找到，尝试查找 JPEG 结束标记
            if (offset === 0) {
                console.log('尝试查找 JPEG 结束标记...');
                for (let i = 0; i < data.byteLength - 2; i++) {
                    if (view.getUint16(i) === 0xFFD9) {
                        // JPEG 结束标记后就是视频数据
                        offset = i + 2;
                        console.log('找到 JPEG 结束标记，偏移值:', offset);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('读取偏移值时出错:', error);
        }
        
        console.log('最终确定的偏移值:', offset);
        
        if (!offset) {
            console.error('未找到视频偏移值');
            throw new Error('未找到视频偏移值，可能不是小米动态照片格式');
        }

        window.showResult('正在分离文件...');
        console.log('开始分离文件...');
        
        // 分离静态图片和视频
        const imageData = data.slice(0, offset);
        const videoData = data.slice(offset);
        
        console.log('图片大小:', imageData.byteLength);
        console.log('视频大小:', videoData.byteLength);

        // 验证分离的文件
        if (!isValidJPEG(imageData)) {
            console.error('图片验证失败');
            throw new Error('分离出的图片文件格式无效');
        }

        // 修改视频验证方法
        let finalVideoData = videoData;
        if (!isValidMP4(videoData)) {
            console.error('视频验证失败');
            // 尝试跳过可能的填充数据
            let validVideoStart = 0;
            const videoView = new DataView(videoData);
            for (let i = 0; i < videoData.byteLength - 8; i++) {
                if (videoView.getUint32(i) === 0x66747970) { // 'ftyp'
                    validVideoStart = i;
                    console.log('找到有效的视频起始位置:', validVideoStart);
                    break;
                }
            }
            if (validVideoStart > 0) {
                console.log('调整视频数据起始位置');
                finalVideoData = videoData.slice(validVideoStart);
            } else {
                throw new Error('分离出的视频文件格式无效');
            }
        }

        // 存储分离后的数据
        window.separatedFiles.imageData = imageData;
        window.separatedFiles.videoData = finalVideoData;
        window.separatedFiles.baseName = livePhoto.name.split('.')[0];

        // 显示下载按钮
        const downloadButtons = document.getElementById('downloadButtons');
        downloadButtons.style.display = 'flex';

        window.showResult('拆分完成！请点击下方按钮下载文件。');
    } catch (error) {
        console.error('拆分失败:', error);
        throw new Error('拆分失败: ' + error.message);
    }
}

// 验证 JPEG 文件格式
function isValidJPEG(data) {
    try {
        const view = new DataView(data);
        // 检查 JPEG 文件头 (0xFFD8) 和文件尾 (0xFFD9)
        return view.getUint16(0) === 0xFFD8 && 
               view.getUint16(data.byteLength - 2) === 0xFFD9;
    } catch (e) {
        return false;
    }
}

// 验证 MP4 文件格式
function isValidMP4(data) {
    try {
        const view = new DataView(data);
        // 检查文件大小
        if (data.byteLength < 8) return false;
        
        // 检查 ftyp box
        const size = view.getUint32(0);
        const type = view.getUint32(4);
        return type === 0x66747970 && // 'ftyp'
               size > 0 && size < data.byteLength;
    } catch (e) {
        return false;
    }
} 