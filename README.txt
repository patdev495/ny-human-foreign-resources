Sau khi commit + push, chạy lệnh:

ssh Admin@192.168.209.62 "cd /d D:\projects_production\NY_hr_sys_new && git reset --hard origin/master && git pull origin master && cd backend && C:\Users\Admin\.local\bin\uv sync && nssm restart ny-foreign-hr-8004"
