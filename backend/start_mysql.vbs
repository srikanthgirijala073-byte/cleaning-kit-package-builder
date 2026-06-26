Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"" --datadir=""c:\Users\SRIKANTH\Downloads\clean_kit_FINAL\cleankit_final\backend\fresh_data"" --port=3307 --shared-memory --skip-grant-tables", 0, False
