// OPPO动态照片处理模块
async function synthesizeOppo(staticImage, videoFile) {
    // TODO: 实现OPPO动态照片合成
    throw new Error('OPPO动态照片合成功能开发中...');
}

async function separateOppo(livePhoto) {
    try {
        console.log('开始处理OPPO动态照片...');
        window.showResult('正在读取文件...');
        const data = await FileUtils.readAsArrayBuffer(livePhoto);
        console.log('文件读取完成，大小:', data.byteLength);
        
        // 读取DirectoryItemLength
        console.log('正在读取EXIF数据...');
        let tags;
        try {
            // 首先尝试使用 ExifReader
            if (typeof ExifReader !== 'undefined') {
                tags = await ExifReader.load(data);
            } else {
                throw new Error('ExifReader not loaded');
            }
        } catch (exifError) {
            console.error('ExifReader error:', exifError);
            // 尝试使用备用方法读取偏移值
            const view = new DataView(data);
            // 搜索特定标记
            let offset = 0;
            for (let i = 0; i < data.byteLength - 4; i++) {
                if (view.getUint32(i) === 0x4C454E47) { // LENG tag
                    offset = view.getUint32(i + 8);
                    break;
                }
            }
            tags = { DirectoryItemLength: { value: offset } };
        }
        
        console.log('EXIF标签:', tags);
        
        const offset = tags.DirectoryItemLength?.value || 0;
        console.log('视频偏移值:', offset);
        
        if (!offset) {
            console.error('未找到视频偏移值');
            throw new Error('未找到视频偏移值，可能不是OPPO动态照片格式');
        }

        window.showResult('正在分离文件...');
        console.log('开始分离文件...');
        
        // 分离静态图片和视频
        const imageData = data.slice(0, offset);
        const videoData = data.slice(offset);
        
        console.log('图片大小:', imageData.byteLength);
        console.log('视频大小:', videoData.byteLength);

        // 下载分离的文件
        const baseName = livePhoto.name.split('.')[0];
        window.showResult('正在保存图片...');
        await FileUtils.downloadFile(imageData, `${baseName}_image.jpg`);
        window.showResult('正在保存视频...');
        await FileUtils.downloadFile(videoData, `${baseName}_video.mp4`);

        window.showResult('拆分完成！文件已下载。');
    } catch (error) {
        console.error('拆分失败:', error);
        throw new Error('拆分失败: ' + error.message);
    }
} 