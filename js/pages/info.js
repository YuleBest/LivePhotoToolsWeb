document.addEventListener('DOMContentLoaded', function() {
    // 设置文件预览
    setupFilePreview('infoPhoto');

    // 获取DOM元素
    const viewInfoBtn = document.getElementById('viewInfoBtn');

    // 语言配置
    const translations = {
        zh: {
            selectFile: '请选择照片文件',
            loading: '读取中...',
            readError: '无法读取照片信息，这可能不是一个有效的图片文件',
            processError: '无法处理这个文件，请确保它是一个有效的图片文件',
            noInfo: '⚠️ 注意: 这张照片没有包含更多可读取的信息',
            basicInfo: '📸 基本信息:',
            fileName: '文件名称',
            fileSize: '文件大小',
            imageSize: '图片尺寸',
            shootingInfo: '📱 拍摄信息:',
            deviceBrand: '设备品牌',
            deviceModel: '设备型号',
            shootingTime: '拍摄时间',
            shootingParams: '🎯 拍摄参数:',
            shutterSpeed: '快门速度',
            seconds: '秒',
            aperture: '光圈值',
            iso: 'ISO感光度',
            focalLength: '焦距',
            locationInfo: '📍 位置信息:',
            coordinates: '坐标',
            softwareInfo: '💻 软件信息:',
            processingSoftware: '处理软件',
            motionPhotoInfo: '🎥 动态照片信息:',
            xiaomiMotionPhoto: '类型: 小米动态照片',
            oppoMotionPhoto: '类型: OPPO 动态照片',
            otherMotionPhoto: '类型: 其他品牌动态照片'
        },
        en: {
            selectFile: 'Please select a photo file',
            loading: 'Loading...',
            readError: 'Unable to read photo information, this might not be a valid image file',
            processError: 'Unable to process this file, please ensure it is a valid image file',
            noInfo: '⚠️ Note: This photo does not contain more readable information',
            basicInfo: '📸 Basic Information:',
            fileName: 'File Name',
            fileSize: 'File Size',
            imageSize: 'Image Size',
            shootingInfo: '📱 Shooting Information:',
            deviceBrand: 'Device Brand',
            deviceModel: 'Device Model',
            shootingTime: 'Shooting Time',
            shootingParams: '🎯 Shooting Parameters:',
            shutterSpeed: 'Shutter Speed',
            seconds: 'sec',
            aperture: 'Aperture',
            iso: 'ISO',
            focalLength: 'Focal Length',
            locationInfo: '📍 Location Information:',
            coordinates: 'Coordinates',
            softwareInfo: '💻 Software Information:',
            processingSoftware: 'Processing Software',
            motionPhotoInfo: '🎥 Motion Photo Information:',
            xiaomiMotionPhoto: 'Type: Xiaomi Motion Photo',
            oppoMotionPhoto: 'Type: OPPO Motion Photo',
            otherMotionPhoto: 'Type: Other Brand Motion Photo'
        }
    };

    // 默认语言
    const DEFAULT_LANG = 'zh';

    // 获取有效的语言设置
    function getValidLang(selectedLang) {
        return translations[selectedLang] ? selectedLang : DEFAULT_LANG;
    }

    // 查看信息功能
    viewInfoBtn.addEventListener('click', async function() {
        const photo = document.getElementById('infoPhoto').files[0];
        const selectedLang = document.getElementById('infoLang')?.value;
        const lang = getValidLang(selectedLang);

        if (!photo) {
            showResult(translations[lang].selectFile, true);
            return;
        }

        try {
            showResult(translations[lang].loading);
            const info = await getPhotoInfo(photo, lang);
            showResult(info);
        } catch (error) {
            showResult(`${translations[lang].readError}: ${error.message}`, true);
        }
    });

    // 读取照片信息
    async function getPhotoInfo(photo, lang) {
        const t = translations[lang];
        return new Promise((resolve, reject) => {
            try {
                EXIF.getData(photo, function() {
                    try {
                        const info = [];
                        let exif = {};
                        
                        // 基本信息（不依赖EXIF）
                        info.push(t.basicInfo);
                        info.push(`${t.fileName}: ${photo.name}`);
                        info.push(`${t.fileSize}: ${(photo.size / 1024 / 1024).toFixed(2)}MB`);
                        
                        // 尝试获取EXIF数据
                        try {
                            exif = EXIF.getAllTags(this) || {};
                        } catch (e) {
                            console.warn('读取EXIF数据时出错:', e);
                            exif = {};
                        }

                        // 图片尺寸
                        if (exif.PixelXDimension && exif.PixelYDimension) {
                            info.push(`${t.imageSize}: ${exif.PixelXDimension} × ${exif.PixelYDimension} px`);
                        }
                        
                        // 拍摄信息
                        if (exif.Make || exif.Model || exif.DateTime) {
                            info.push(`\n${t.shootingInfo}`);
                            if (exif.Make) info.push(`${t.deviceBrand}: ${exif.Make}`);
                            if (exif.Model) info.push(`${t.deviceModel}: ${exif.Model}`);
                            if (exif.DateTime) info.push(`${t.shootingTime}: ${exif.DateTime}`);
                        }
                        
                        // 拍摄参数
                        if (exif.ExposureTime || exif.FNumber || exif.ISOSpeedRatings || exif.FocalLength) {
                            info.push(`\n${t.shootingParams}`);
                            if (exif.ExposureTime) {
                                const exposureTime = exif.ExposureTime < 1 
                                    ? `1/${Math.round(1/exif.ExposureTime)}` 
                                    : exif.ExposureTime;
                                info.push(`${t.shutterSpeed}: ${exposureTime} ${t.seconds}`);
                            }
                            if (exif.FNumber) info.push(`${t.aperture}: f/${exif.FNumber}`);
                            if (exif.ISOSpeedRatings) info.push(`${t.iso}: ${exif.ISOSpeedRatings}`);
                            if (exif.FocalLength) info.push(`${t.focalLength}: ${exif.FocalLength}mm`);
                        }
                        
                        // GPS信息
                        try {
                            if (exif.GPSLatitude && exif.GPSLongitude) {
                                info.push(`\n${t.locationInfo}`);
                                const lat = convertDMSToDD(exif.GPSLatitude, exif.GPSLatitudeRef);
                                const lng = convertDMSToDD(exif.GPSLongitude, exif.GPSLongitudeRef);
                                info.push(`${t.coordinates}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                            }
                        } catch (e) {
                            console.warn('解析GPS信息时出错:', e);
                        }
                        
                        // 软件信息
                        if (exif.Software) {
                            info.push(`\n${t.softwareInfo}`);
                            info.push(`${t.processingSoftware}: ${exif.Software}`);
                        }

                        // 动态照片相关信息
                        try {
                            const motionPhotoInfo = getMotionPhotoInfo(exif, lang);
                            if (motionPhotoInfo) {
                                info.push(`\n${t.motionPhotoInfo}`);
                                info.push(motionPhotoInfo);
                            }
                        } catch (e) {
                            console.warn('检查动态照片信息时出错:', e);
                        }

                        if (info.length <= 3) {
                            info.push(`\n${t.noInfo}`);
                        }

                        resolve(info.join('\n'));
                    } catch (error) {
                        console.error('解析照片信息时出错:', error);
                        reject(new Error(t.readError));
                    }
                });
            } catch (error) {
                console.error('EXIF.getData调用失败:', error);
                reject(new Error(t.processError));
            }
        });
    }

    // 将GPS的度分秒格式转换为十进制度数
    function convertDMSToDD(dms, ref) {
        try {
            const degrees = dms[0] || 0;
            const minutes = dms[1] || 0;
            const seconds = dms[2] || 0;
            
            let dd = degrees + minutes/60 + seconds/3600;
            if (ref === 'S' || ref === 'W') {
                dd = dd * -1;
            }
            return dd;
        } catch (e) {
            console.warn('GPS坐标转换出错:', e);
            return 0;
        }
    }

    // 获取动态照片相关信息
    function getMotionPhotoInfo(exif, lang) {
        const t = translations[lang];
        try {
            // 检查小米动态照片标记
            if (exif.MiMotionPhoto || exif.MiMotionPhotoVersion) {
                return t.xiaomiMotionPhoto;
            }
            
            // 检查 OPPO 动态照片标记
            if (exif.Software && exif.Software.includes('OPPO')) {
                return t.oppoMotionPhoto;
            }

            // 检查其他可能的动态照片标记
            const keys = Object.keys(exif);
            if (keys.some(key => 
                key.toLowerCase().includes('motion') || 
                key.toLowerCase().includes('live') ||
                key.toLowerCase().includes('dynamic'))) {
                return t.otherMotionPhoto;
            }
        } catch (e) {
            console.warn('检查动态照片类型时出错:', e);
        }

        return null;
    }
}); 