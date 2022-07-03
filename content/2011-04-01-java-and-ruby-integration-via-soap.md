---
title: Java and Ruby integration via SOAP
tags: Java, Ruby, JRuby
date: 01/04/2011
---

In my last blog we talked about Ruby and Java integration via JRuby. Since JRuby runs on JVM, bytecode can be shared but in case you do not want a JVM level integration then SOAP is usually your next level of support.

Imagine a scenario where you want to call a SOAP server written in Java from Ruby, this is quite common as most enterprises have their middleware written in Java and new application can be written quickly in Ruby/Rails. Here is how you can go about integrating the two -

**The Java Server**

I am not going to cover this in detail here but for new deployments Apache CXF is quite popular. You can integrate it with Spring as given <a href="https://cwiki.apache.org/CXF20DOC/writing-a-service-with-spring.html">here</a>. The Maven dependencies are as follows -

    <properties>
      <cxf.version>2.3.3</cxf.version>
      <spring.version>3.0.4.RELEASE</spring.version>
    </properties>

    <dependencies>
      <!-- CXF dependencies -->
      <dependency>
        <groupId>org.apache.cxf</groupId>
        <artifactId>cxf-rt-frontend-jaxws</artifactId>
        <version>${cxf.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.cxf</groupId>
        <artifactId>cxf-rt-transports-http</artifactId>
        <version>${cxf.version}</version>
      </dependency>
          <!-- End CXF dependencies -->

          <!-- Spring dependencies -->
          <!-- add other dependencies -->
    </dependencies>

The Java code looks like -

    @WebService
    public interface EmployeeService {

      Employee findEmployeeByID(@WebParam(name = "employeeID")long empID);
      boolean storeEmployee(@WebParam(name = "employee")Employee emp);

    }

And the Implementation looks like -

    @Component("employeeService")
    @WebService(endpointInterface = "in.mysoapserver.services.EmployeeService")
    public class EmployeeServiceImpl implements EmployeeService {

      @Override
      public Employee findEmployeeByID(long empID) {
        Employee employee = new Employee();
        employee.setEmpID(101);
        employee.setName("Rocky");
        employee.setAge(32);
        return employee;
      }

      @Override
      public boolean storeEmployee(Employee emp) {
        //Store Employee
        return true;
      }

    }

After deploying the project in Tomcat you can get the WSDL from a link like - **http://localhost:8080/mysoapserver/soap?wsdl**

Once you have the WSDL you should use SoapUI for some testing to check if the SOAP requests are working.

**The Ruby Client**
Now we are ready to create the SOAP client in Ruby. Please note the instructions below are same for Ruby or JRuby.

First install soap4r gem -
**gem install soap4r**

Download (and unpack) the soap4r binary .tar.gz also from <a href="http://dev.ctor.org/soap4r">here</a>

Now, just to organize things create a folder say "ruby_soap_client" and copy the WSDL of the SOAP services we created there.

Got to the folder where the WSDL is copied and run -
**~/01rocky/02apps/soap4r-1.5.8/bin/wsdl2ruby.rb --type client --wsdl mysoapserver.wsdl**

- Change the path to wsdl2ruby.rb as per your setup.

This will create a set of Ruby scripts and also create an example client. Since we will make our own client you can safely delete the *Client.rb and *Driver.rb scripts.

Now let us create our own Ruby client -

    require 'soap/wsdlDriver'
    require 'EmployeeServiceImplService.rb'

    wsdl = "mysoapserver.wsdl"

    employee_service = SOAP::WSDLDriverFactory.new(wsdl).create_rpc_driver

    response = employee_service.findEmployeeByID(FindEmployeeByID.new(10))
    puts response.return.name
    puts response.return.age

    response = employee_service.storeEmployee(StoreEmployee.new(Employee.new(30,102,"Tushar")))
    puts response.return

Lets examine each line in detail.
Line 1 - Just loading the required libraries for soap4r
Line 2 - The 3rd file that wsdl2ruby.rb script generated. We'll look at it in a minute.
Line 4 - Just a variable for the wsdl file name. Change it according to your setup.
Line 6 - We create a SOAP RPC driver using the wsdl we saved earlier.
Line 8/12 - Next we make the SOAP call. But wait a minute, what is being passed as a parameter here?

The answer to this can be found if we look at the SOAP request we made from SoapUI -

    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.mysoapserver.in/">
      <soapenv:Header/>
      <soapenv:Body>
          <ser:findEmployeeByID>
            <employeeID>10</employeeID>
          </ser:findEmployeeByID>
      </soapenv:Body>
    </soapenv:Envelope>

And for storeEmployee call -

    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.mysoapserver.in/">
      <soapenv:Header/>
      <soapenv:Body>
          <ser:storeEmployee>
            <employee>
                <age>30</age>
                <empID>102</empID>
                <name>Tushar</name>
            </employee>
          </ser:storeEmployee>
      </soapenv:Body>
    </soapenv:Envelope>

If we ignore the XML namespaces, our request is wrapped in a "findEmployeeByID" tag (for the findEmployeeByID call). Therefore, when we gave the wsdl2ruby.rb scpirt our WSDL reference, it created the equivalent Ruby classes for all wrappers, request and response types and stored it in a file which we referenced at Line 2.

So looking at the sample requests in SoapUI we can create wrapper and request objects and similarly parse the response received. Its as simple as that. In case you are stuck, you can look at all the classes created by the wsdl2ruby script by having a look at the generated file (EmployeeServiceImplService.rb in our case).
