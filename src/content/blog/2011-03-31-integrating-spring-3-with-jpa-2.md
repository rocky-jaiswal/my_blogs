---
title: Integrating Spring 3 with JPA 2
tags: Java, JPA, Spring
date: 31/03/2011
---

I have been working on Grails recently and am amazed with the productivity gains it gives. Grails is great for giving you a kick-start, it uses convention over configuration and gives you things such as ORM, transaction management, dependency injection among others, without you writing a single line of configuration.

I decided to mimic the Grails behavior in a Spring + Hibernate application. To stay on the cutting edge I decided to use Hibernate 3.5 and Spring 3, to top it up I decided to use Hibernate as an implementation of JPA 2. Recently released, Hibernate 3.5 combines the Hibernate Annotations and the Hibernate Entity-Manager projects into Hibernate-Core, so basically its just one jar which provides the full implementation of JPA 2. For advantages of using JPA 2 see the excellent presentation here - <a href="http://jazoon.com/portals/0/Content/ArchivWebsite/jazoon.com/jazoon09/download/presentations/8461.pdf">http://jazoon.com/portals/0/Content/ArchivWebsite/jazoon.com/jazoon09/download/presentations/8461.pdf</a>

__Integrating Hibernate with JPA 2__

As usual, I started with a vanilla maven web project and started adding dependencies, the first being Hibernate - 
	
	<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>3.5.4-Final</version>
	</dependency>

This dependency is found in the repository - <a href="https://repository.jboss.org/nexus/content/groups/public/">https://repository.jboss.org/nexus/content/groups/public/</a> as mentioned on the Hibernate site. After a lot of pain I found that this jar did not match the jar you from <a href="http://sourceforge.net/projects/hibernate/files/hibernate3">http://sourceforge.net/projects/hibernate/files/hibernate3</a>. So, I had to manually install the jar in my local repository (remember, I found this out after setting up JPA, Spring etc. which I will cover next). Similarly, in the JBoss repository I could not find the JPA 2 specfication jar (again available if you download the Hibernate distribution from sourceforge).I had to install that manually as well. After all this jiggery-pokery and some more, I somehow got Hibernate and JPA working.

JPA needs a persistence.xml file in META-INF folder in the classpath. I added META-INF folder in source/main/resources with persistence.xml reading as - 
	
	<persistence xmlns="http://java.sun.com/xml/ns/persistence"
	    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	    xsi:schemaLocation="http://java.sun.com/xml/ns/persistence http://java.sun.com/xml/ns/persistence/persistence_2_0.xsd"
	    version="2.0">
		<persistence-unit name="postage" transaction-type="RESOURCE_LOCAL">
			<provider>org.hibernate.ejb.HibernatePersistence</provider>
		</persistence-unit>
	</persistence>

So, here I basically tell JPA that Hibernate is providing its implementation. Plus I give my persistence-unit a name "postage" (the name of my application).

__Integrating Spring with JPA__

Now, I need to get Spring working with JPA and it is not exactly a cakewalk. With a lot of people pointing in different directions and the Spring documentation itself not very helpful in this particular aspect.

The Spring JPA support itself offers three ways of setting up the JPA EntityManagerFactory, so that it can be used by the application to obtain an entity manager. I chose the "LocalContainerEntityManagerFactoryBean" because it gives full control over EntityManagerFactory configuration and is appropriate for fine-grained customization, if required. Below is my config - 
	
	<bean id="entityManagerFactory" class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean"
		p:dataSource-ref="dataSource">
		<property name="jpaProperties">
			<props>
				<prop key="hibernate.dialect">${hibernate.dialect}</prop>
				<prop key="hibernate.hbm2ddl.auto">${hibernate.hbm2ddl.auto}</prop>
				<prop key="hibernate.show_sql">${hibernate.show_sql}</prop>
			</props>
		</property>      
	</bean>

As evident, you need a "dataSource" bean defined, which looks like - 

	<bean id="dataSource" class="org.springframework.jdbc.datasource.DriverManagerDataSource"
		p:driverClassName="${dataSource.driverClassName}"
		p:url="${dataSource.url}"
		p:username="${dataSource.username}"
		p:password="${dataSource.password}"
	/>

To get the "${}" thingy working, i.e. a properties file lookup, add - 

	<context:property-placeholder location="classpath:datasource.properties"/>

datasource.properties can look like - 

	dataSource.driverClassName=org.hsqldb.jdbcDriver
	dataSource.url=jdbc:hsqldb:mem:postage
	dataSource.username=sa
	dataSource.password=
	#Hibernate Properties
	hibernate.hbm2ddl.auto=create-drop
	hibernate.dialect=org.hibernate.dialect.HSQLDialect
	hibernate.show_sql=true

To get transactions working, add - 

	<tx:annotation-driven/>

And define a transaction manager - 

	<bean id="transactionManager" class="org.springframework.orm.jpa.JpaTransactionManager"
			p:entityManagerFactory-ref="entityManagerFactory"
	/>

Now, assuming that you have an Entity "Post", lets create the DAO - 

	@Repository
	@Transactional
	public class PostageDAOImpl implements PostageDAO {

		@PersistenceContext
		private EntityManager em;

		public void savePost(Post post){
			em.persist(post);
			em.flush();
		}

	}


The @Transactional annotation makes the DAO transactional (remember we added <tx:annotation-driven/>). Let's look at the other Annotations - @Repository annotation is a "stereotype" annotation added in Spring 2.5 which enables Spring to identify Beans for AOP pointcuts. In our case @Repository annotation also enables Spring to automatically convert JPA exceptions to Spring exception hierarchy. Finally, the EntityManager is automatically injected by Spring as it is annotated by @PersistenceContext. Also add - 
      
      <context:component-scan base-package="net.rocky.postage"/>

This tag enables dependency injection with annotations and also auto-detects stereotype classes in the specified package and registers the corresponding beans. 

That's it! We have integrated Spring with JPA 2 and Hibernate. Let's write a test case to verify our setup - 

	@RunWith(SpringJUnit4ClassRunner.class)
	@ContextConfiguration("/applicationContext.xml")
	public class PostageDAOImplTest {

		@Resource
		private PostageDAO postageDAOImpl;

		@Test
		public void testPostStorage() throws Exception {
			Post post = new Post();
			post.setComments("A simple comment");
			post.setDescription("A simple description");
			postageDAOImpl.savePost(post);
		}

	...

__Parting thoughts__

This whole exercise took me a long time due to lack of comprehensive documentation, version mismatches and multiple approaches suggested by documents/bloggers. The advantage of the approach I have suggested above is that it allows you to switch to different databases for test/production as the datasource and dialect is specified in a .properties file.

The big idea behind this exercise was to setup a DAO and domain layer akin to Grails which can be easily scaled up. We can further add a service layer to access the data and then use it over a UI. For my next blog I will build on this and create a web application that uses GWT as the front-end.
