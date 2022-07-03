---
title: Excel manipulation and testing in Java
tags: Java
date: 25/06/2011
---

In my current project I am doing a lot of Excel manipulation using Apache POI and Jacob COM libraries. One of the first challenges I faced was to write test cases that could read these Excel files and process them. This wasn't rocket science, but I want to blog about this so that a. I can share my approach and b. So that I can use this blog post in case I want to do this in the future.

So my Excel file which I want to test is stored in /src/test/resources as Gantt_XLS.xls in a Maven setup.So here is my test case -

    @Test
    public void shouldConvertExcelFile() throws IOException {
        InputStream inputStream = getClass().getResourceAsStream("/Gantt_XLS.xls");
        File file = convertToFile(inputStream);
        
        String outpath = FileUtils.getTempDirectory().getCanonicalPath() + File.separator + UUID.randomUUID().toString();
        FileUtils.forceMkdir(new File(outpath));
        
        excelConverter.doExcelConversion(file, outpath);
        
        Assert.assertTrue(fileStatusMap.get("Gantt_XLS.xls").equals(FileStatus.CONVERTED_TO_EXCEL));
    }

    private File convertToFile(InputStream inputStream) throws IOException {
        String path = FileUtils.getTempDirectoryPath() + File.separator + UUID.randomUUID().toString() + File.separator;
        FileUtils.forceMkdir(new File(path));
        File f = new File(path + "Gantt_XLS.xls");
        OutputStream out = new FileOutputStream(f);
        byte buf[] = new byte[1024];
        int len;
        while ((len = inputStream.read(buf)) > 0) {
            out.write(buf, 0, len);
        }
        out.close();
        inputStream.close();
        return f;
    }

So in this code, I am reading a file in the test resources folder as a InputStream, writing the stream to a file in a unique directory in my OS's temp directory and finally processing the file.

Now, the other task I am trying to do is converting a SpreadsheetML file to a binary Excel file. SpreadsheetML is MS Office Excel 2003 format for storing Excel files in XML format. For this I am using the <a href="http://danadler.com/jacob/" target="_blank">Jacob COM library</a>. 

    @Override
        public boolean doConversionTask() {
            boolean success = true;
            try {
                ActiveXComponent excel = new ActiveXComponent("Excel.Application");
                Dispatch workbook = Dispatch.call(excel.getProperty("Workbooks").toDispatch(), "Open", inFilePath).toDispatch();
                Dispatch.call(workbook, "SaveAs", tempFilePath, 43);
                Dispatch.call(excel.getProperty("Workbooks").toDispatch(), "Close");
            } catch (Exception e) {
                log.error("Error in converting HTML to Excel : " + e.getMessage());
                success =  false;
            } finally {
                 excel.invoke("Quit", new Variant[]{});
                 ComThread.Release();
            }
            return success;
        }

Hopefully this will help someone out there.
