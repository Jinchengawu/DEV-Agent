---
name: terraform-iac
description: Terraform 基础设施即代码最佳实践
tags: [devops, terraform, iac, infrastructure]
---

# Terraform IaC 技能

## 触发条件

- 创建云基础设施
- 配置 AWS/GCP/Azure
- 基础设施版本控制
- 多环境管理

## 基础配置

### main.tf
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}
```

### 变量定义
```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
```

## AWS 资源示例

### VPC 配置
```hcl
# vpc.tf
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "${var.environment}-public-subnet"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-igw"
  }
}
```

### EC2 实例
```hcl
# ec2.tf
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id
  
  tags = {
    Name = "${var.environment}-web-server"
  }
}

resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg"
  description = "Security group for web server"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### RDS 数据库
```hcl
# rds.tf
resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  
  db_name  = "myapp"
  username = "admin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "prod"
}
```

## 输出定义

```hcl
# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "web_server_ip" {
  description = "Web server public IP"
  value       = aws_instance.web.public_ip
}

output "db_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
```

## 常用命令

```bash
# 初始化
terraform init

# 计划
terraform plan -var="environment=dev"

# 应用
terraform apply -var="environment=dev"

# 销毁
terraform destroy -var="environment=dev"

# 查看状态
terraform state list
terraform state show aws_instance.web
```

## 最佳实践

### 状态管理
- 使用远程后端（S3 + DynamoDB）
- 启用状态锁
- 定期备份状态文件

### 模块化
```hcl
# 模块使用
module "vpc" {
  source = "./modules/vpc"
  
  cidr_block = "10.0.0.0/16"
  environment = var.environment
}
```

### 多环境
```bash
# 目录结构
environments/
├── dev/
│   └── terraform.tfvars
├── staging/
│   └── terraform.tfvars
└── prod/
    └── terraform.tfvars
```

---

**技能版本**：v1.0
